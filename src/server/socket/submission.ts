import type { Server, Socket } from 'socket.io'
import { prisma } from '@/lib/prisma'

function getTeamIdFromSocket(socket: Socket): string | undefined {
  for (const room of socket.rooms) {
    if (room.startsWith('team:')) {
      return room.slice(5)
    }
  }
  return undefined
}

function getGameIdFromSocket(socket: Socket): string | undefined {
  for (const room of socket.rooms) {
    if (room.startsWith('game:')) {
      return room.slice(5)
    }
  }
  return undefined
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

      if (roundItem.claimedByTeamId !== null) {
        io.to(`team:${teamId}`).emit('submission:discarded', {
          roundItemId,
          reason: 'already_claimed',
        })
        return
      }

      const maxPosition = await prisma.submission.aggregate({
        where: { roundItemId },
        _max: { position: true },
      })

      const position = (maxPosition._max.position ?? 0) + 1

      await prisma.submission.create({
        data: {
          roundItemId,
          teamId,
          photoUrl,
          status: 'pending',
          position,
        },
      })

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

        // Re-check claim status inside the transaction
        const roundItem = await tx.roundItem.findUnique({
          where: { id: submission.roundItemId },
        })

        if (!roundItem) {
          return { error: 'Round item not found' } as const
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

        return {
          approved: true,
          roundItemId: roundItem.id,
          teamId: submission.teamId,
          teamName: submission.team.name,
          teamColour: submission.team.colour,
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

        // Discard all other pending submissions for this round item
        const competingSubmissions = await prisma.submission.findMany({
          where: {
            roundItemId: result.roundItemId,
            status: 'pending',
          },
        })

        for (const sub of competingSubmissions) {
          await prisma.submission.update({
            where: { id: sub.id },
            data: { status: 'discarded' },
          })
          io.to(`team:${sub.teamId}`).emit('submission:discarded', {
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
            await prisma.game.update({
              where: { id: gameId },
              data: { status: 'ended' },
            })

            const teams = await prisma.team.findMany({
              where: { gameId, round: game.round },
              orderBy: { createdAt: 'asc' },
            })

            const roundItems = await prisma.roundItem.findMany({
              where: { gameId, round: game.round },
              select: { claimedByTeamId: true },
            })

            const summary = teams
              .map((t) => ({
                teamId: t.id,
                teamName: t.name,
                teamColour: t.colour,
                claimedCount: roundItems.filter(
                  (ri) => ri.claimedByTeamId === t.id,
                ).length,
              }))
              .sort((a, b) => b.claimedCount - a.claimedCount)

            io.to(`game:${gameId}`).emit('game:ended', { summary })
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
