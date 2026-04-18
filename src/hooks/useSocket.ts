'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { getSocket } from '@/lib/socket'
import type { Socket } from '@/lib/socket'

let clientSocket: Socket | null = null
const listeners = new Set<() => void>()

function subscribe(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

function getSnapshot(): Socket | null {
  return clientSocket
}

function getServerSnapshot(): Socket | null {
  return null
}

export const useSocket = (): Socket | null => {
  const socket = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  useEffect(() => {
    if (clientSocket) return

    const s = getSocket()
    if (!s) return

    if (!s.connected) {
      s.connect()
    }
    clientSocket = s
    for (const cb of listeners) cb()

    return () => {
      s.disconnect()
      clientSocket = null
      for (const cb of listeners) cb()
    }
  }, [])

  return socket
}
