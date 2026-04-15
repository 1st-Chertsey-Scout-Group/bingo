import type { Server, Socket } from 'socket.io'
import { prisma } from '@/lib/prisma'
import { generateBoard } from '@/lib/game-logic'

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

    const updatedGame = await prisma.game.update({
      where: { id: gameId },
      data: {
        round: game.round + 1,
        status: 'active',
        roundStartedAt: new Date(),
      },
    })

    // Query items and template values for board generation
    const [concreteItems, templateItems, templateValues, recentRoundItems] =
      await Promise.all([
        prisma.item.findMany({ where: { isTemplate: false } }),
        prisma.item.findMany({ where: { isTemplate: true } }),
        prisma.templateValue.findMany(),
        prisma.roundItem.findMany({
          where: {
            gameId: updatedGame.id,
            round: { gte: updatedGame.round - 2 },
          },
          select: { itemId: true },
        }),
      ])

    const recentItemIds = [...new Set(recentRoundItems.map((ri) => ri.itemId))]

    try {
      generateBoard({
        boardSize: updatedGame.boardSize,
        templateCount: updatedGame.templateCount,
        allItems: concreteItems,
        templateItems,
        templateValues,
        recentItemIds,
      })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Board generation failed'
      await prisma.game.update({
        where: { id: gameId },
        data: { status: 'lobby', round: game.round, roundStartedAt: null },
      })
      socket.emit('error', { message })
      return
    }
  })

  socket.on('game:end', () => {
    // TODO: calculate summary, update game status, emit results
  })

  socket.on('game:newround', () => {
    // TODO: generate new board, increment round, emit to game room
  })
}
