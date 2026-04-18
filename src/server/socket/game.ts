import type { Server, Socket } from 'socket.io'
import {
  ALL_CATEGORIES,
  BOARD_CONFIG,
  GAME_STATUS,
  type ItemCategory,
} from '@/lib/constants'
import { getErrorMessage } from '@/lib/errors'
import { prisma } from '@/lib/prisma'
import { generateBoard, refreshBoardItem } from '@/lib/game-logic'
import { deleteObjects } from '@/lib/s3'
import { requireLeaderContext, SOCKET_ROOMS } from '@/lib/socket-helpers'
import { clearGameLocations } from '@/server/socket/location'

async function sweepOrphanUploads(gameId: string): Promise<void> {
  const orphans = await prisma.pendingUpload.findMany({
    where: { gameId, consumedAt: null },
    select: { id: true, photoKey: true },
  })
  if (orphans.length === 0) return

  try {
    await deleteObjects(orphans.map((o) => o.photoKey))
  } catch (err) {
    const message = getErrorMessage(err)
    console.error(`Failed to delete orphan S3 uploads: ${message}`)
    return
  }

  await prisma.pendingUpload.deleteMany({
    where: { id: { in: orphans.map((o) => o.id) } },
  })
}

export async function endGame(io: Server, gameId: string): Promise<void> {
  clearGameLocations(gameId)

  await prisma.game.update({
    where: { id: gameId },
    data: { status: GAME_STATUS.ENDED },
  })

  void sweepOrphanUploads(gameId).catch((err: unknown) => {
    const message = getErrorMessage(err)
    console.error(`Orphan upload sweep failed: ${message}`)
  })

  const teams = await prisma.team.findMany({
    where: { gameId },
    orderBy: { createdAt: 'asc' },
  })

  const roundItems = await prisma.roundItem.findMany({
    where: { gameId },
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

  io.to(SOCKET_ROOMS.game(gameId)).emit('game:ended', { summary })
}

function validateCategories(categories: unknown): categories is string[] {
  if (!Array.isArray(categories)) return false
  const validSet = new Set<string>(ALL_CATEGORIES)
  return categories.every(
    (c) => typeof c === 'string' && validSet.has(c as ItemCategory),
  )
}

function validateBoardConfig(
  boardSize: unknown,
  templateCount: unknown,
): { boardSize: number; templateCount: number } | null {
  if (
    typeof boardSize !== 'number' ||
    boardSize < BOARD_CONFIG.SIZE_MIN ||
    boardSize > BOARD_CONFIG.SIZE_MAX ||
    boardSize % BOARD_CONFIG.SIZE_STEP !== 0
  ) {
    return null
  }
  if (
    typeof templateCount !== 'number' ||
    templateCount < BOARD_CONFIG.TEMPLATE_MIN ||
    templateCount > BOARD_CONFIG.TEMPLATE_MAX
  ) {
    return null
  }
  if (templateCount > boardSize) return null
  return { boardSize, templateCount }
}

async function queryBoardData() {
  const [concreteItems, templateItems, templateValues] = await Promise.all([
    prisma.item.findMany({ where: { isTemplate: false } }),
    prisma.item.findMany({ where: { isTemplate: true } }),
    prisma.templateValue.findMany(),
  ])

  return { concreteItems, templateItems, templateValues }
}

export function registerGameHandlers(io: Server, socket: Socket): void {
  // Preview a board without persisting
  socket.on(
    'board:preview',
    async (
      payload:
        | {
            categories: string[]
            boardSize: number
            templateCount: number
          }
        | undefined,
    ) => {
      const ctx = requireLeaderContext(socket)
      if (!ctx) return
      const { gameId } = ctx

      const game = await prisma.game.findUnique({ where: { id: gameId } })
      if (!game || game.status !== GAME_STATUS.LOBBY) {
        socket.emit('error', { message: 'Game is not in lobby' })
        return
      }

      if (!validateCategories(payload?.categories)) {
        socket.emit('error', { message: 'Invalid categories' })
        return
      }

      const config = validateBoardConfig(
        payload?.boardSize,
        payload?.templateCount,
      )
      if (!config) {
        socket.emit('error', { message: 'Invalid board configuration' })
        return
      }

      const { concreteItems, templateItems, templateValues } =
        await queryBoardData()

      const filteredCount = concreteItems.filter((item) =>
        payload.categories.includes(item.category),
      ).length

      if (filteredCount + config.templateCount < config.boardSize) {
        socket.emit('error', {
          message: `Not enough items — enable more categories or reduce board size (${String(filteredCount)} items available)`,
        })
        return
      }

      try {
        const board = generateBoard({
          boardSize: config.boardSize,
          templateCount: config.templateCount,
          allItems: concreteItems,
          templateItems,
          templateValues,

          categories: payload.categories,
        })

        socket.emit('board:preview', { board })
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Board generation failed'
        socket.emit('error', { message })
      }
    },
  )

  // Refresh a single item on the preview board
  socket.on(
    'board:refresh-item',
    async (
      payload:
        | {
            currentBoard: Array<{ itemId: string; displayName: string }>
            indexToReplace: number
            categories: string[]
          }
        | undefined,
    ) => {
      const ctx = requireLeaderContext(socket)
      if (!ctx) return
      const { gameId } = ctx

      const game = await prisma.game.findUnique({ where: { id: gameId } })
      if (!game || game.status !== GAME_STATUS.LOBBY) {
        socket.emit('error', { message: 'Game is not in lobby' })
        return
      }

      if (
        !payload ||
        !Array.isArray(payload.currentBoard) ||
        typeof payload.indexToReplace !== 'number' ||
        !validateCategories(payload.categories)
      ) {
        socket.emit('error', { message: 'Invalid refresh request' })
        return
      }

      const { concreteItems, templateItems, templateValues } =
        await queryBoardData()

      const result = refreshBoardItem({
        currentBoard: payload.currentBoard,
        indexToReplace: payload.indexToReplace,
        allItems: concreteItems,
        templateItems,
        templateValues,
        recentItemIds: [],
        categories: payload.categories,
      })

      if (!result) {
        socket.emit('error', { message: 'No replacement available' })
        return
      }

      socket.emit('board:refresh-item', {
        index: payload.indexToReplace,
        item: result,
      })
    },
  )

  // Start a round with a confirmed board from the leader
  socket.on(
    'game:start',
    async (
      payload:
        | {
            confirmedBoard?: Array<{ itemId: string; displayName: string }>
          }
        | undefined,
    ) => {
      const ctx = requireLeaderContext(socket)
      if (!ctx) return
      const { gameId } = ctx

      const game = await prisma.game.findUnique({ where: { id: gameId } })
      if (!game) {
        socket.emit('error', { message: 'Game not found' })
        return
      }

      if (game.status !== GAME_STATUS.LOBBY) {
        socket.emit('error', { message: 'Game is not in lobby' })
        return
      }

      const teamCount = await prisma.team.count({
        where: { gameId },
      })
      if (teamCount < 1) {
        socket.emit('error', { message: 'At least one team required' })
        return
      }

      let boardItems: Array<{ itemId: string; displayName: string }>

      if (payload?.confirmedBoard && Array.isArray(payload.confirmedBoard)) {
        // Use the leader's confirmed preview board
        const board = payload.confirmedBoard

        if (
          board.length < BOARD_CONFIG.SIZE_MIN ||
          board.length > BOARD_CONFIG.SIZE_MAX ||
          board.length % BOARD_CONFIG.SIZE_STEP !== 0
        ) {
          socket.emit('error', { message: 'Invalid board size' })
          return
        }

        // Validate all itemIds exist
        const itemIds = board.map((b) => b.itemId)
        const existingItems = await prisma.item.findMany({
          where: { id: { in: itemIds } },
          select: { id: true },
        })
        const existingSet = new Set(existingItems.map((i) => i.id))
        const allExist = itemIds.every((id) => existingSet.has(id))

        if (!allExist) {
          socket.emit('error', { message: 'Board contains invalid items' })
          return
        }

        boardItems = board
      } else {
        // Fallback: auto-generate board (backward compatibility)
        const { concreteItems, templateItems, templateValues } =
          await queryBoardData()

        try {
          boardItems = generateBoard({
            boardSize: BOARD_CONFIG.SIZE_DEFAULT,
            templateCount: BOARD_CONFIG.TEMPLATE_DEFAULT,
            allItems: concreteItems,
            templateItems,
            templateValues,
          })
        } catch (err) {
          const message =
            err instanceof Error ? err.message : 'Board generation failed'
          socket.emit('error', { message })
          return
        }
      }

      let startResult: {
        updatedGame: { id: string; roundStartedAt: Date | null }
        roundItems: Array<{ id: string; displayName: string }>
      }
      try {
        startResult = await prisma.$transaction(async (tx) => {
          const updatedGame = await tx.game.update({
            where: { id: gameId },
            data: {
              status: GAME_STATUS.ACTIVE,
              roundStartedAt: new Date(),
            },
          })

          await tx.roundItem.createMany({
            data: boardItems.map((item) => ({
              gameId: updatedGame.id,
              itemId: item.itemId,
              displayName: item.displayName,
            })),
          })

          const roundItems = await tx.roundItem.findMany({
            where: { gameId: updatedGame.id },
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

      io.to(SOCKET_ROOMS.game(updatedGame.id)).emit('game:started', {
        board,
        roundStartedAt: (
          updatedGame.roundStartedAt ?? new Date()
        ).toISOString(),
      })
    },
  )

  socket.on('game:end', async () => {
    const ctx = requireLeaderContext(socket)
    if (!ctx) return
    const { gameId } = ctx

    const game = await prisma.game.findUnique({ where: { id: gameId } })
    if (!game || game.status !== GAME_STATUS.ACTIVE) {
      socket.emit('error', { message: 'Game is not active' })
      return
    }

    await endGame(io, gameId)
  })

  socket.on('game:newround', async () => {
    const ctx = requireLeaderContext(socket)
    if (!ctx) return
    const { gameId } = ctx

    const game = await prisma.game.findUnique({ where: { id: gameId } })
    if (!game || game.status !== GAME_STATUS.ENDED) {
      socket.emit('error', { message: 'Game is not ended' })
      return
    }

    clearGameLocations(gameId)

    // Delete all round data so we start fresh
    await prisma.submission.deleteMany({
      where: { roundItem: { gameId } },
    })
    await prisma.pendingUpload.deleteMany({ where: { gameId } })
    await prisma.roundItem.deleteMany({ where: { gameId } })
    await prisma.team.deleteMany({ where: { gameId } })

    await prisma.game.update({
      where: { id: gameId },
      data: {
        roundStartedAt: null,
        status: GAME_STATUS.LOBBY,
        teamsLocked: false,
      },
    })

    io.to(SOCKET_ROOMS.game(gameId)).emit('game:lobby', {})
  })
}
