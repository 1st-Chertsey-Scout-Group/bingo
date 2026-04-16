import type { Server, Socket } from 'socket.io'
import { prisma } from '@/lib/prisma'
import { generateBoard } from '@/lib/game-logic'
import { deleteObjects } from '@/lib/s3'

async function sweepOrphanUploads(gameId: string): Promise<void> {
  const orphans = await prisma.pendingUpload.findMany({
    where: { gameId, consumedAt: null },
    select: { id: true, photoKey: true },
  })
  if (orphans.length === 0) return

  try {
    await deleteObjects(orphans.map((o) => o.photoKey))
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`Failed to delete orphan S3 uploads: ${message}`)
    return
  }

  await prisma.pendingUpload.deleteMany({
    where: { id: { in: orphans.map((o) => o.id) } },
  })
}

export async function endGame(
  io: Server,
  gameId: string,
  round: number,
): Promise<void> {
  await prisma.game.update({
    where: { id: gameId },
    data: { status: 'ended' },
  })

  void sweepOrphanUploads(gameId).catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`Orphan upload sweep failed: ${message}`)
  })

  const teams = await prisma.team.findMany({
    where: { gameId, round },
    orderBy: { createdAt: 'asc' },
  })

  const roundItems = await prisma.roundItem.findMany({
    where: { gameId, round },
    select: { claimedByTeamId: true },
  })

  const summary = teams
    .map((t) => ({
      teamId: t.id,
      teamName: t.name,
      teamColour: t.colour,
      claimedCount: roundItems.filter((ri) => ri.claimedByTeamId === t.id)
        .length,
    }))
    .sort((a, b) => b.claimedCount - a.claimedCount)

  io.to(`game:${gameId}`).emit('game:ended', { summary })
}

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

    const teamCount = await prisma.team.count({
      where: { gameId, round: game.round },
    })
    if (teamCount < 2) {
      socket.emit('error', { message: 'At least two teams required' })
      return
    }

    // Query items and template values for board generation
    const [concreteItems, templateItems, templateValues, recentRoundItems] =
      await Promise.all([
        prisma.item.findMany({ where: { isTemplate: false } }),
        prisma.item.findMany({ where: { isTemplate: true } }),
        prisma.templateValue.findMany(),
        prisma.roundItem.findMany({
          where: {
            gameId: game.id,
            round: { gte: game.round - 2 },
          },
          select: { itemId: true },
        }),
      ])

    const recentItemIds = [...new Set(recentRoundItems.map((ri) => ri.itemId))]

    let boardItems: Array<{ itemId: string; displayName: string }>

    try {
      boardItems = generateBoard({
        boardSize: game.boardSize,
        templateCount: game.templateCount,
        allItems: concreteItems,
        templateItems,
        templateValues,
        recentItemIds,
      })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Board generation failed'
      socket.emit('error', { message })
      return
    }

    let startResult: {
      updatedGame: { id: string; round: number; roundStartedAt: Date | null }
      roundItems: Array<{ id: string; displayName: string }>
    }
    try {
      startResult = await prisma.$transaction(async (tx) => {
        const updatedGame = await tx.game.update({
          where: { id: gameId },
          data: {
            status: 'active',
            roundStartedAt: new Date(),
          },
        })

        await tx.roundItem.createMany({
          data: boardItems.map((item) => ({
            gameId: updatedGame.id,
            itemId: item.itemId,
            displayName: item.displayName,
            round: updatedGame.round,
          })),
        })

        const roundItems = await tx.roundItem.findMany({
          where: { gameId: updatedGame.id, round: updatedGame.round },
          select: { id: true, displayName: true },
        })

        return { updatedGame, roundItems }
      })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to start round'
      socket.emit('error', { message })
      return
    }

    const { updatedGame, roundItems } = startResult

    const board = roundItems.map((roundItem) => ({
      roundItemId: roundItem.id,
      displayName: roundItem.displayName,
      claimedByTeamId: null,
      claimedByTeamName: null,
      claimedByTeamColour: null,
      hasPendingSubmissions: false,
      lockedByLeader: null,
    }))

    io.to(`game:${updatedGame.id}`).emit('game:started', {
      board,
      roundStartedAt: (updatedGame.roundStartedAt ?? new Date()).toISOString(),
    })
  })

  socket.on('game:end', async () => {
    const gameId = socket.data.gameId as string | undefined
    if (!gameId) {
      socket.emit('error', { message: 'Not connected to a game' })
      return
    }

    if (socket.data.role !== 'leader') {
      socket.emit('error', { message: 'Only leaders can end the game' })
      return
    }

    const game = await prisma.game.findUnique({ where: { id: gameId } })
    if (!game || game.status !== 'active') {
      socket.emit('error', { message: 'Game is not active' })
      return
    }

    await endGame(io, gameId, game.round)
  })

  socket.on('game:newround', async () => {
    const gameId = socket.data.gameId as string | undefined
    if (!gameId) {
      socket.emit('error', { message: 'Not connected to a game' })
      return
    }

    if (socket.data.role !== 'leader') {
      socket.emit('error', { message: 'Only leaders can start a new round' })
      return
    }

    const game = await prisma.game.findUnique({ where: { id: gameId } })
    if (!game || game.status !== 'ended') {
      socket.emit('error', { message: 'Game is not ended' })
      return
    }

    await prisma.game.update({
      where: { id: gameId },
      data: {
        round: game.round + 1,
        roundStartedAt: null,
        status: 'lobby',
      },
    })

    io.to(`game:${gameId}`).emit('game:lobby', {})
  })
}
