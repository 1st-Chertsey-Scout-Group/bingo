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

  socket.on('review:close', () => {
    // TODO: unlock submission
  })

  socket.on('review:approve', () => {
    // TODO: mark approved, update board, notify team
  })

  socket.on('review:reject', () => {
    // TODO: mark rejected, notify team
  })
}
