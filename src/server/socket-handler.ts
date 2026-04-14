import type { Server, Socket } from 'socket.io'

import { registerGameHandlers } from '@/server/socket/game'
import { registerLobbyHandlers } from '@/server/socket/lobby'
import { registerSubmissionHandlers } from '@/server/socket/submission'

export function registerSocketHandlers(io: Server): void {
  io.on('connection', (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`)

    registerLobbyHandlers(io, socket)
    registerGameHandlers(io, socket)
    registerSubmissionHandlers(io, socket)

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`)
    })
  })
}
