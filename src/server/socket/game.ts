import type { Server, Socket } from 'socket.io'
import { prisma } from '@/lib/prisma'

export function registerGameHandlers(io: Server, socket: Socket): void {
  socket.on('game:start', async () => {
    const gameId = socket.data.gameId as string | undefined
    if (!gameId) {
      socket.emit('error', { message: 'Not connected to a game' })
      return
    }

    if (socket.data.role !== 'leader') {
      socket.emit('error', { message: 'Only leaders can start the game' })
      return
    }

    const game = await prisma.game.findUnique({ where: { id: gameId } })
    if (!game) {
      socket.emit('error', { message: 'Game not found' })
      return
    }

    if (game.status !== 'lobby') {
      socket.emit('error', { message: 'Game is not in lobby' })
      return
    }

    await prisma.game.update({
      where: { id: gameId },
      data: {
        round: game.round + 1,
        status: 'active',
        roundStartedAt: new Date(),
      },
    })
  })

  socket.on('game:end', () => {
    // TODO: calculate summary, update game status, emit results
  })

  socket.on('game:newround', () => {
    // TODO: generate new board, increment round, emit to game room
  })
}
