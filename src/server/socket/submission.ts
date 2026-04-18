import type { Server, Socket } from 'socket.io'
import { GAME_STATUS, SUBMISSION_STATUS } from '@/lib/constants'
import { prisma } from '@/lib/prisma'
import { getPhotoUrlPrefix } from '@/lib/s3'
import {
  acquireLock,
  releaseLock,
  releaseLeaderLock,
  UNLOCK_DATA,
} from '@/lib/services/lock-service'
import {
  requireLeaderContext,
  requireScoutContext,
  requireString,
  SOCKET_ROOMS,
} from '@/lib/socket-helpers'
import { getNextPendingSubmission } from '@/lib/repositories/submission'
import { endGame } from '@/server/socket/game'

type SubmissionWithContext = NonNullable<
  Awaited<ReturnType<typeof getNextPendingSubmission>>
>

function emitReviewSubmission(
  socket: Socket,
  submission: SubmissionWithContext,
): void {
  socket.emit('review:submission', {
    submissionId: submission.id,
    roundItemId: submission.roundItemId,
    displayName: submission.roundItem.displayName,
    teamName: submission.team.name,
    teamColour: submission.team.colour,
    photoUrl: submission.photoUrl,
  })
}

function broadcastSquareUnlocked(
  io: Server,
  gameId: string,
  roundItemId: string,
  hasPendingSubmissions = true,
): void {
  io.to(SOCKET_ROOMS.leaders(gameId)).emit('square:unlocked', {
    roundItemId,
    hasPendingSubmissions,
  })
}

function emitSubmissionDiscarded(
  io: Server,
  teamId: string,
  roundItemId: string,
): void {
  io.to(SOCKET_ROOMS.team(teamId)).emit('submission:discarded', {
    roundItemId,
    reason: 'already_claimed',
  })
}

export function registerSubmissionHandlers(io: Server, socket: Socket): void {
  socket.on(
    'submission:submit',
    async (payload: { roundItemId: string; photoUrl: string } | undefined) => {
      const roundItemId = payload?.roundItemId
      const photoUrl = payload?.photoUrl

      if (
        !requireString(socket, roundItemId, 'roundItemId') ||
        !requireString(socket, photoUrl, 'photoUrl')
      ) {
        return
      }

      if (socket.data.role !== 'scout') {
        socket.emit('error', { message: 'Only scouts can submit' })
        return
      }

      const ctx = requireScoutContext(socket)
      if (!ctx) return
      const { gameId, teamId } = ctx

      const game = await prisma.game.findUnique({ where: { id: gameId } })
      if (!game || game.status !== GAME_STATUS.ACTIVE) {
        socket.emit('error', { message: 'Game is not active' })
        return
      }

      const roundItem = await prisma.roundItem.findUnique({
        where: { id: roundItemId },
      })

      if (!roundItem || roundItem.gameId !== gameId) {
        socket.emit('error', { message: 'Invalid round item' })
        return
      }

      const team = await prisma.team.findUnique({ where: { id: teamId } })
      if (!team || team.gameId !== gameId) {
        socket.emit('error', { message: 'Invalid team' })
        return
      }

      if (team.socketId !== socket.id) {
        socket.emit('error', { message: 'Team session is not yours' })
        return
      }

      const expectedPrefix = getPhotoUrlPrefix(gameId)
      if (!photoUrl.startsWith(expectedPrefix)) {
        socket.emit('error', { message: 'Invalid photo URL' })
        return
      }

      const createResult = await prisma.$transaction(async (tx) => {
        const current = await tx.roundItem.findUnique({
          where: { id: roundItemId },
        })
        if (!current) {
          return { kind: 'invalid' as const }
        }
        if (current.claimedByTeamId !== null) {
          return { kind: 'claimed' as const }
        }

        const existingPending = await tx.submission.findFirst({
          where: { roundItemId, teamId, status: SUBMISSION_STATUS.PENDING },
          select: { id: true },
        })
        if (existingPending) {
          return { kind: 'duplicate' as const }
        }

        const maxPosition = await tx.submission.aggregate({
          where: { roundItemId },
          _max: { position: true },
        })

        const position = (maxPosition._max.position ?? 0) + 1

        await tx.submission.create({
          data: {
            roundItemId,
            teamId,
            photoUrl,
            status: SUBMISSION_STATUS.PENDING,
            position,
          },
        })

        await tx.pendingUpload.updateMany({
          where: { photoUrl, consumedAt: null },
          data: { consumedAt: new Date() },
        })

        return { kind: 'ok' as const }
      })

      if (createResult.kind === 'invalid') {
        socket.emit('error', { message: 'Invalid round item' })
        return
      }
      if (createResult.kind === 'duplicate') {
        socket.emit('error', {
          message: 'You already have a pending submission for this square',
        })
        return
      }
      if (createResult.kind === 'claimed') {
        emitSubmissionDiscarded(io, teamId, roundItemId)
        return
      }

      io.to(SOCKET_ROOMS.game(gameId)).emit('square:pending', { roundItemId })
      io.to(SOCKET_ROOMS.team(teamId)).emit('submission:received', {
        roundItemId,
      })
    },
  )

  socket.on(
    'review:open',
    async (payload: { roundItemId: string } | undefined) => {
      const roundItemId = payload?.roundItemId
      if (!requireString(socket, roundItemId, 'roundItemId')) return

      const ctx = requireLeaderContext(socket)
      if (!ctx) return
      const { gameId, leaderName } = ctx

      const game = await prisma.game.findUnique({ where: { id: gameId } })
      if (!game || game.status !== GAME_STATUS.ACTIVE) {
        socket.emit('error', { message: 'Game is not active' })
        return
      }

      const roundItem = await prisma.roundItem.findUnique({
        where: { id: roundItemId },
      })

      if (!roundItem || roundItem.gameId !== gameId) {
        socket.emit('error', { message: 'Invalid round item' })
        return
      }

      if (roundItem.claimedByTeamId !== null) {
        socket.emit('error', { message: 'Square already claimed' })
        return
      }

      // Check for pending submissions
      const pendingCount = await prisma.submission.count({
        where: { roundItemId, status: SUBMISSION_STATUS.PENDING },
      })

      if (pendingCount === 0) {
        socket.emit('error', { message: 'No pending submissions' })
        return
      }

      // Lock conflict: different leader holds the lock
      if (
        roundItem.lockedByLeader !== null &&
        roundItem.lockedByLeader !== leaderName
      ) {
        socket.emit('error', {
          message: `Square is locked by ${roundItem.lockedByLeader}`,
        })
        return
      }

      // One-lock-per-leader: release any existing lock held by this leader
      const releasedId = await releaseLeaderLock(
        gameId,
        leaderName,
        roundItemId,
      )

      if (releasedId) {
        broadcastSquareUnlocked(io, gameId, releasedId)
      }

      // Lock the square
      await acquireLock(roundItemId, leaderName)

      io.to(SOCKET_ROOMS.leaders(gameId)).emit('square:locked', {
        roundItemId,
        leaderName,
      })

      // Find the first pending submission
      const submission = await getNextPendingSubmission(roundItemId)

      if (submission) {
        emitReviewSubmission(socket, submission)
      }
    },
  )

  socket.on(
    'review:close',
    async (payload: { roundItemId: string } | undefined) => {
      const roundItemId = payload?.roundItemId
      if (!requireString(socket, roundItemId, 'roundItemId')) return

      const ctx = requireLeaderContext(socket)
      if (!ctx) return
      const { gameId, leaderName } = ctx

      const roundItem = await prisma.roundItem.findUnique({
        where: { id: roundItemId },
      })

      if (!roundItem) {
        socket.emit('error', { message: 'Round item not found' })
        return
      }

      if (roundItem.lockedByLeader !== leaderName) {
        socket.emit('error', { message: 'You do not hold the lock' })
        return
      }

      await releaseLock(roundItemId)

      broadcastSquareUnlocked(io, gameId, roundItemId)
    },
  )

  socket.on(
    'review:approve',
    async (payload: { submissionId: string } | undefined) => {
      const submissionId = payload?.submissionId
      if (!requireString(socket, submissionId, 'submissionId')) return

      const ctx = requireLeaderContext(socket)
      if (!ctx) return
      const { gameId, leaderName } = ctx

      const result = await prisma.$transaction(async (tx) => {
        const submission = await tx.submission.findUnique({
          where: { id: submissionId },
          include: { roundItem: true, team: true },
        })

        if (!submission) {
          return { error: 'Submission not found' } as const
        }

        if (submission.status !== SUBMISSION_STATUS.PENDING) {
          return { error: 'Submission is no longer pending' } as const
        }

        // Re-check claim status inside the transaction
        const roundItem = await tx.roundItem.findUnique({
          where: { id: submission.roundItemId },
        })

        if (!roundItem) {
          return { error: 'Round item not found' } as const
        }

        if (roundItem.lockedByLeader !== leaderName) {
          return { error: 'You do not hold the lock' } as const
        }

        if (roundItem.claimedByTeamId !== null) {
          // Race lost: square already claimed
          await tx.submission.update({
            where: { id: submissionId },
            data: { status: SUBMISSION_STATUS.DISCARDED },
          })
          return {
            discarded: true,
            roundItemId: roundItem.id,
            teamId: submission.teamId,
          } as const
        }

        // Claim the square
        await tx.roundItem.update({
          where: { id: roundItem.id },
          data: {
            claimedByTeamId: submission.teamId,
            ...UNLOCK_DATA,
          },
        })

        // Approve the submission
        await tx.submission.update({
          where: { id: submissionId },
          data: { status: SUBMISSION_STATUS.APPROVED, reviewedBy: leaderName },
        })

        // Discard all other pending submissions atomically so no
        // concurrent submission:submit can slip a new pending row in.
        const competing = await tx.submission.findMany({
          where: {
            roundItemId: roundItem.id,
            status: SUBMISSION_STATUS.PENDING,
          },
          select: { id: true, teamId: true },
        })

        await tx.submission.updateMany({
          where: {
            roundItemId: roundItem.id,
            status: SUBMISSION_STATUS.PENDING,
          },
          data: { status: SUBMISSION_STATUS.DISCARDED },
        })

        return {
          approved: true,
          roundItemId: roundItem.id,
          teamId: submission.teamId,
          teamName: submission.team.name,
          teamColour: submission.team.colour,
          discardedTeamIds: competing.map((s) => s.teamId),
        } as const
      })

      if ('error' in result) {
        socket.emit('error', { message: result.error })
        return
      }

      if ('discarded' in result) {
        emitSubmissionDiscarded(io, result.teamId, result.roundItemId)
        return
      }

      if ('approved' in result) {
        // Broadcast square:claimed to all clients
        io.to(SOCKET_ROOMS.game(gameId)).emit('square:claimed', {
          roundItemId: result.roundItemId,
          teamId: result.teamId,
          teamName: result.teamName,
          teamColour: result.teamColour,
        })

        // Notify the team
        io.to(SOCKET_ROOMS.team(result.teamId)).emit('submission:approved', {
          roundItemId: result.roundItemId,
        })

        // Notify leaders that the lock is released
        broadcastSquareUnlocked(io, gameId, result.roundItemId)

        for (const teamId of result.discardedTeamIds) {
          emitSubmissionDiscarded(io, teamId, result.roundItemId)
        }

        // Auto-end check: if all squares are claimed, end the game
        const game = await prisma.game.findUnique({ where: { id: gameId } })
        if (game && game.status === GAME_STATUS.ACTIVE) {
          const unclaimedCount = await prisma.roundItem.count({
            where: {
              gameId,
              claimedByTeamId: null,
            },
          })

          if (unclaimedCount === 0) {
            await endGame(io, gameId)
          }
        }
      }
    },
  )

  socket.on(
    'review:reject',
    async (payload: { submissionId: string } | undefined) => {
      const submissionId = payload?.submissionId
      if (!requireString(socket, submissionId, 'submissionId')) return

      const ctx = requireLeaderContext(socket)
      if (!ctx) return
      const { gameId, leaderName } = ctx

      const result = await prisma.$transaction(async (tx) => {
        const submission = await tx.submission.findUnique({
          where: { id: submissionId },
          include: { roundItem: true, team: true },
        })

        if (!submission) {
          return { error: 'Submission not found' } as const
        }

        if (submission.status !== SUBMISSION_STATUS.PENDING) {
          return { error: 'Submission is no longer pending' } as const
        }

        if (submission.roundItem.lockedByLeader !== leaderName) {
          return { error: 'You do not hold the lock' } as const
        }

        if (submission.roundItem.claimedByTeamId !== null) {
          return { error: 'Square already claimed' } as const
        }

        await tx.submission.update({
          where: { id: submissionId },
          data: {
            status: SUBMISSION_STATUS.REJECTED,
            reviewedBy: leaderName,
          },
        })

        return {
          rejected: true,
          roundItemId: submission.roundItemId,
          teamId: submission.teamId,
        } as const
      })

      if ('error' in result) {
        socket.emit('error', { message: result.error })
        return
      }

      // Notify the team
      io.to(SOCKET_ROOMS.team(result.teamId)).emit('submission:rejected', {
        roundItemId: result.roundItemId,
      })

      // Find the next pending submission in the queue
      const nextSubmission = await getNextPendingSubmission(result.roundItemId)

      if (nextSubmission) {
        emitReviewSubmission(socket, nextSubmission)
      } else {
        // No more submissions: release the lock
        await releaseLock(result.roundItemId)

        broadcastSquareUnlocked(io, gameId, result.roundItemId, false)
      }
    },
  )
}
