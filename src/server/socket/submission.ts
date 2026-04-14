import type { Server, Socket } from 'socket.io'

export function registerSubmissionHandlers(io: Server, socket: Socket): void {
  socket.on('submission:submit', () => {
    // TODO: validate submission, store in DB, notify leaders
  })

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
