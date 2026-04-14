import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export const getSocket = (): Socket | null => {
  if (typeof window === 'undefined') return null

  if (!socket) {
    socket = io(window.location.origin)
  }

  return socket
}

export type { Socket }
