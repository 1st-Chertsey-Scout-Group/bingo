import type { Server, Socket } from 'socket.io'
import { prisma } from '@/lib/prisma'
import { getPhotoUrlPrefix } from '@/lib/s3'
import { endGame } from '@/server/socket/game'

function getTeamIdFromSocket(socket: Socket): string | undefined {
  const teamId = socket.data.teamId
  return typeof teamId === 'string' ? teamId : undefined
}

function getGameIdFromSocket(socket: Socket): string | undefined {
  const gameId = socket.data.gameId
  return typeof gameId === 'string' ? gameId : undefined
}

export function registerSubmissionHandlers(io: Server, socket: Socket): void {
  socket.on(
    'submission:submit',
    async (payload: { roundItemId: string; photoUrl: string } | undefined) => {
      const roundItemId = payload?.roundItemId
      const photoUrl = payload?.photoUrl

      if (
        typeof roundItemId !== 'string' ||
        roundItemId.trim() === '' ||
        typeof photoUrl !== 'string' ||
        photoUrl.trim() === ''
      ) {
        socket.emit('error', {
          message: 'roundItemId and photoUrl are required',
        })
        return
      }

      if (socket.data.role !== 'scout') {
        socket.emit('error', { message: 'Only scouts can submit' })
        return
      }

      const gameId = getGameIdFromSocket(socket)
      const teamId = getTeamIdFromSocket(socket)

      if (!gameId || !teamId) {
        socket.emit('error', { message: 'Not connected to a game' })
        return
      }

      const game = await prisma.game.findUnique({ where: { id: gameId } })
      if (!game || game.status !== 'active') {
        socket.emit('error', { message: 'Game is not active' })
        return
      }

      const roundItem = await prisma.roundItem.findUnique({
        where: { id: roundItemId },
      })

      if (
        !roundItem ||
        roundItem.gameId !== gameId ||
        roundItem.round !== game.round
      ) {
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
          where: { roundItemId, teamId, status: 'pending' },
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
            status: 'pending',
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
        io.to(`team:${teamId}`).emit('submission:discarded', {
          roundItemId,
          reason: 'already_claimed',
        })
        return
      }

      io.to(`game:${gameId}`).emit('square:pending', { roundItemId })
      io.to(`team:${teamId}`).emit('submission:received', { roundItemId })
    },
  )

  socket.on(
    'review:open',
    async (payload: { roundItemId: string } | undefined) => {
      const roundItemId = payload?.roundItemId
      if (typeof roundItemId !== 'string' || roundItemId.trim() === '') {
        socket.emit('error', { message: 'roundItemId is required' })
        return
      }

      const gameId = getGameIdFromSocket(socket)
      const leaderName = socket.data.leaderName as string | undefined

      if (!gameId || !leaderName) {
        socket.emit('error', { message: 'Not connected as a leader' })
        return
      }

      const game = await prisma.game.findUnique({ where: { id: gameId } })
      if (!game || game.status !== 'active') {
        socket.emit('error', { message: 'Game is not active' })
        return
      }

      const roundItem = await prisma.roundItem.findUnique({
        where: { id: roundItemId },
      })

      if (
        !roundItem ||
        roundItem.gameId !== gameId ||
        roundItem.round !== game.round
      ) {
        socket.emit('error', { message: 'Invalid round item' })
        return
      }

      if (roundItem.claimedByTeamId !== null) {
        socket.emit('error', { message: 'Square already claimed' })
        return
      }

      // Check for pending submissions
      const pendingCount = await prisma.submission.count({
        where: { roundItemId, status: 'pending' },
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
      const existingLock = await prisma.roundItem.findFirst({
        where: {
          gameId,
          round: game.round,
          lockedByLeader: leaderName,
          id: { not: roundItemId },
        },
      })

      if (existingLock) {
        await prisma.roundItem.update({
          where: { id: existingLock.id },
          data: { lockedByLeader: null, lockedAt: null },
        })
        io.to(`leaders:${gameId}`).emit('square:unlocked', {
          roundItemId: existingLock.id,
        })
      }

      // Lock the square
      await prisma.roundItem.update({
        where: { id: roundItemId },
        data: { lockedByLeader: leaderName, lockedAt: new Date() },
      })

      io.to(`leaders:${gameId}`).emit('square:locked', {
        roundItemId,
        leaderName,
      })

      // Find the first pending submission
      const submission = await prisma.submission.findFirst({
        where: { roundItemId, status: 'pending' },
        orderBy: { position: 'asc' },
        include: { team: true, roundItem: true },
      })

      if (submission) {
        socket.emit('review:submission', {
          submissionId: submission.id,
          roundItemId: submission.roundItemId,
          displayName: submission.roundItem.displayName,
          teamName: submission.team.name,
          teamColour: submission.team.colour,
          photoUrl: submission.photoUrl,
        })
      }
    },
  )

  socket.on(
    'review:close',
    async (payload: { roundItemId: string } | undefined) => {
      const roundItemId = payload?.roundItemId
      if (typeof roundItemId !== 'string' || roundItemId.trim() === '') {
        socket.emit('error', { message: 'roundItemId is required' })
        return
      }

      const gameId = getGameIdFromSocket(socket)
      const leaderName = socket.data.leaderName as string | undefined

      if (!gameId || !leaderName) {
        socket.emit('error', { message: 'Not connected as a leader' })
        return
      }

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

      await prisma.roundItem.update({
        where: { id: roundItemId },
        data: { lockedByLeader: null, lockedAt: null },
      })

      io.to(`leaders:${gameId}`).emit('square:unlocked', { roundItemId })
    },
  )

  socket.on(
    'review:approve',
    async (payload: { submissionId: string } | undefined) => {
      const submissionId = payload?.submissionId
      if (typeof submissionId !== 'string' || submissionId.trim() === '') {
        socket.emit('error', { message: 'submissionId is required' })
        return
      }

      const gameId = getGameIdFromSocket(socket)
      const leaderName = socket.data.leaderName as string | undefined

      if (!gameId || !leaderName) {
        socket.emit('error', { message: 'Not connected as a leader' })
        return
      }

      const result = await prisma.$transaction(async (tx) => {
        const submission = await tx.submission.findUnique({
          where: { id: submissionId },
          include: { roundItem: true, team: true },
        })

        if (!submission) {
          return { error: 'Submission not found' } as const
        }

        if (submission.status !== 'pending') {
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
            data: { status: 'discarded' },
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
            lockedByLeader: null,
            lockedAt: null,
          },
        })

        // Approve the submission
        await tx.submission.update({
          where: { id: submissionId },
          data: { status: 'approved', reviewedBy: leaderName },
        })

        // Discard all other pending submissions atomically so no
        // concurrent submission:submit can slip a new pending row in.
        const competing = await tx.submission.findMany({
          where: {
            roundItemId: roundItem.id,
            status: 'pending',
          },
          select: { id: true, teamId: true },
        })

        await tx.submission.updateMany({
          where: {
            roundItemId: roundItem.id,
            status: 'pending',
          },
          data: { status: 'discarded' },
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
        io.to(`team:${result.teamId}`).emit('submission:discarded', {
          roundItemId: result.roundItemId,
          reason: 'already_claimed',
        })
        return
      }

      if ('approved' in result) {
        // Broadcast square:claimed to all clients
        io.to(`game:${gameId}`).emit('square:claimed', {
          roundItemId: result.roundItemId,
          teamId: result.teamId,
          teamName: result.teamName,
          teamColour: result.teamColour,
        })

        // Notify the team
        io.to(`team:${result.teamId}`).emit('submission:approved', {
          roundItemId: result.roundItemId,
        })

        // Notify leaders that the lock is released
        io.to(`leaders:${gameId}`).emit('square:unlocked', {
          roundItemId: result.roundItemId,
        })

        for (const teamId of result.discardedTeamIds) {
          io.to(`team:${teamId}`).emit('submission:discarded', {
            roundItemId: result.roundItemId,
            reason: 'already_claimed',
          })
        }

        // Auto-end check: if all squares are claimed, end the game
        const game = await prisma.game.findUnique({ where: { id: gameId } })
        if (game && game.status === 'active') {
          const unclaimedCount = await prisma.roundItem.count({
            where: {
              gameId,
              round: game.round,
              claimedByTeamId: null,
            },
          })

          if (unclaimedCount === 0) {
            await endGame(io, gameId, game.round)
          }
        }
      }
    },
  )

  socket.on(
    'review:reject',
    async (payload: { submissionId: string } | undefined) => {
      const submissionId = payload?.submissionId
      if (typeof submissionId !== 'string' || submissionId.trim() === '') {
        socket.emit('error', { message: 'submissionId is required' })
        return
      }

      const gameId = getGameIdFromSocket(socket)
      const leaderName = socket.data.leaderName as string | undefined

      if (!gameId || !leaderName) {
        socket.emit('error', { message: 'Not connected as a leader' })
        return
      }

      const submission = await prisma.submission.findUnique({
        where: { id: submissionId },
        include: { roundItem: true, team: true },
      })

      if (!submission) {
        socket.emit('error', { message: 'Submission not found' })
        return
      }

      if (submission.status !== 'pending') {
        socket.emit('error', { message: 'Submission is no longer pending' })
        return
      }

      if (submission.roundItem.lockedByLeader !== leaderName) {
        socket.emit('error', { message: 'You do not hold the lock' })
        return
      }

      // Reject the submission
      await prisma.submission.update({
        where: { id: submissionId },
        data: { status: 'rejected', reviewedBy: leaderName },
      })

      // Notify the team
      io.to(`team:${submission.teamId}`).emit('submission:rejected', {
        roundItemId: submission.roundItemId,
      })

      // Find the next pending submission in the queue
      const nextSubmission = await prisma.submission.findFirst({
        where: {
          roundItemId: submission.roundItemId,
          status: 'pending',
        },
        orderBy: { position: 'asc' },
        include: { team: true, roundItem: true },
      })

      if (nextSubmission) {
        // Auto-promote: send the next submission to the reviewing leader
        socket.emit('review:submission', {
          submissionId: nextSubmission.id,
          roundItemId: nextSubmission.roundItemId,
          displayName: nextSubmission.roundItem.displayName,
          teamName: nextSubmission.team.name,
          teamColour: nextSubmission.team.colour,
          photoUrl: nextSubmission.photoUrl,
        })
      } else {
        // No more submissions: release the lock
        await prisma.roundItem.update({
          where: { id: submission.roundItemId },
          data: {
            lockedByLeader: null,
            lockedAt: null,
          },
        })

        io.to(`leaders:${gameId}`).emit('square:unlocked', {
          roundItemId: submission.roundItemId,
        })
      }
    },
  )
}
