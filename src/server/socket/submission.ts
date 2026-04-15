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
    },
  )

  socket.on('review:open', () => {
    // TODO: lock submission, send photo to leader
  })

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
