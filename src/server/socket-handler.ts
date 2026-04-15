import type { Server, Socket } from 'socket.io'

import { prisma } from '@/lib/prisma'
import { registerGameHandlers } from '@/server/socket/game'
import { registerLobbyHandlers } from '@/server/socket/lobby'
import { registerSubmissionHandlers } from '@/server/socket/submission'

const LOCK_TIMEOUT_MS = 30_000

// Track pending lock timeouts by leader name
const lockTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

export function cancelLockTimeout(leaderName: string): void {
  const timeout = lockTimeouts.get(leaderName)
  if (timeout) {
    clearTimeout(timeout)
    lockTimeouts.delete(leaderName)
  }
}

export function registerSocketHandlers(io: Server): void {
  io.on('connection', (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`)

    registerLobbyHandlers(io, socket)
    registerGameHandlers(io, socket)
    registerSubmissionHandlers(io, socket)

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`)

      const leaderName = socket.data.leaderName as string | undefined
      const gameId = socket.data.gameId as string | undefined

      if (!leaderName || !gameId) return

      // Start 30-second lock timeout
      const timeout = setTimeout(() => {
        lockTimeouts.delete(leaderName)
        void (async () => {
          const lockedItem = await prisma.roundItem.findFirst({
            where: { gameId, lockedByLeader: leaderName },
          })

          if (lockedItem) {
            await prisma.roundItem.update({
              where: { id: lockedItem.id },
              data: { lockedByLeader: null, lockedAt: null },
            })
            io.to(`leaders:${gameId}`).emit('square:unlocked', {
              roundItemId: lockedItem.id,
            })
          }
        })()
      }, LOCK_TIMEOUT_MS)

      lockTimeouts.set(leaderName, timeout)
    })
  })
}
