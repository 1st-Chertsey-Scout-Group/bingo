import type { Server, Socket } from 'socket.io'

export function registerGameHandlers(io: Server, socket: Socket): void {
  socket.on('game:start', () => {
    // TODO: generate board, start round, emit to game room
  })

  socket.on('game:end', () => {
    // TODO: calculate summary, update game status, emit results
  })

  socket.on('game:newround', () => {
    // TODO: generate new board, increment round, emit to game room
  })
}
