'use client'

import { useEffect, useRef } from 'react'
import { getSocket } from '@/lib/socket'
import type { Socket } from '@/lib/socket'

export const useSocket = (): Socket | null => {
  const socketRef = useRef<Socket | null>(null)

  if (typeof window === 'undefined') return null

  if (!socketRef.current) {
    socketRef.current = getSocket()
  }

  useEffect(() => {
    const socket = socketRef.current
    if (socket && !socket.connected) {
      socket.connect()
    }

    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [])

  return socketRef.current
}
