import type { Server, Socket } from 'socket.io'

export function registerLobbyHandlers(io: Server, socket: Socket): void {
  socket.on('lobby:join', () => {
    // TODO: validate game PIN, assign team, join rooms
  })

  socket.on('rejoin', () => {
    // TODO: validate teamId, rejoin rooms, send full state
  })
}
