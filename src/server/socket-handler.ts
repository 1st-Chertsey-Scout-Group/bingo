import type { Server, Socket } from 'socket.io'

import { GAME_STATUS } from '@/lib/constants'
import { getErrorMessage } from '@/lib/errors'
import { prisma } from '@/lib/prisma'
import { getTeamsInGame } from '@/lib/repositories/team'
import {
  findLeaderLock,
  releaseLock,
  sweepStaleLocks,
} from '@/lib/services/lock-service'
import { getSocketContext, SOCKET_ROOMS } from '@/lib/socket-helpers'
import { registerGameHandlers } from '@/server/socket/game'
import { registerLobbyHandlers } from '@/server/socket/lobby'
import { registerLocationHandlers } from '@/server/socket/location'
import { registerSubmissionHandlers } from '@/server/socket/submission'

const LOCK_TIMEOUT_MS = 30_000
const LOBBY_TEAM_GRACE_MS = 15_000

// Track pending lock timeouts by composite (gameId, leaderName) key
const lockTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

function lockTimeoutKey(gameId: string, leaderName: string): string {
  return `${gameId}:${leaderName}`
}

export function cancelLockTimeout(gameId: string, leaderName: string): void {
  const key = lockTimeoutKey(gameId, leaderName)
  const timeout = lockTimeouts.get(key)
  if (timeout) {
    clearTimeout(timeout)
    lockTimeouts.delete(key)
  }
}

// Track pending team-deletion timeouts for scouts disconnecting during lobby
const teamDeleteTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

export function cancelTeamDeleteTimeout(teamId: string): void {
  const timeout = teamDeleteTimeouts.get(teamId)
  if (timeout) {
    clearTimeout(timeout)
    teamDeleteTimeouts.delete(teamId)
  }
}

export function registerSocketHandlers(io: Server): void {
  void sweepStaleLocks().catch((err: unknown) => {
    console.error(
      `Failed to sweep stale locks on startup: ${getErrorMessage(err)}`,
    )
  })

  io.on('connection', (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`)

    registerLobbyHandlers(io, socket)
    registerGameHandlers(io, socket)
    registerSubmissionHandlers(io, socket)
    registerLocationHandlers(io, socket)

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`)

      const ctx = getSocketContext(socket)
      if (!ctx) return
      const { gameId } = ctx

      // Scout disconnect during lobby: grace period before deleting team
      if (ctx.teamId && ctx.role === 'scout') {
        const teamId = ctx.teamId
        const timeout = setTimeout(() => {
          teamDeleteTimeouts.delete(teamId)
          void (async () => {
            try {
              const game = await prisma.game.findUnique({
                where: { id: gameId },
              })
              if (game && game.status === GAME_STATUS.LOBBY) {
                await prisma.team.delete({ where: { id: teamId } })
                const teams = await getTeamsInGame(gameId)
                io.to(SOCKET_ROOMS.game(gameId)).emit('lobby:teams', { teams })
              }
            } catch {
              // Team may already be deleted
            }
          })()
        }, LOBBY_TEAM_GRACE_MS)

        teamDeleteTimeouts.set(teamId, timeout)
      }

      // Leader disconnect: start lock timeout
      if (ctx.leaderName) {
        const leaderName = ctx.leaderName
        const key = lockTimeoutKey(gameId, leaderName)
        const timeout = setTimeout(() => {
          lockTimeouts.delete(key)
          void (async () => {
            const lockedItem = await findLeaderLock(gameId, leaderName)
            if (lockedItem) {
              await releaseLock(lockedItem.id)
              io.to(SOCKET_ROOMS.leaders(gameId)).emit('square:unlocked', {
                roundItemId: lockedItem.id,
                hasPendingSubmissions: true,
              })
            }
          })()
        }, LOCK_TIMEOUT_MS)

        lockTimeouts.set(key, timeout)
      }
    })
  })
}
