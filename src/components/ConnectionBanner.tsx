'use client'

import { useEffect, useState } from 'react'
import { useSocket } from '@/hooks/useSocket'

export function ConnectionBanner() {
  const socket = useSocket()
  const [disconnected, setDisconnected] = useState(false)

  useEffect(() => {
    if (!socket) return

    const handleDisconnect = () => setDisconnected(true)
    const handleConnect = () => setDisconnected(false)

    socket.on('disconnect', handleDisconnect)
    socket.on('connect', handleConnect)

    // Check initial state
    if (!socket.connected) {
      setDisconnected(true)
    }

    return () => {
      socket.off('disconnect', handleDisconnect)
      socket.off('connect', handleConnect)
    }
  }, [socket])

  if (!disconnected) return null

  return (
    <div className="fixed top-0 right-0 left-0 z-50 bg-amber-500 px-4 py-2 text-center text-sm font-medium text-white">
      No connection — trying to reconnect...
    </div>
  )
}
