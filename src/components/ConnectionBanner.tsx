'use client'

import { useEffect, useState } from 'react'
import { useSocket } from '@/hooks/useSocket'

export function ConnectionBanner() {
  const socket = useSocket()
  const [disconnected, setDisconnected] = useState(
    () => socket !== null && !socket.connected,
  )

  useEffect(() => {
    if (!socket) return

    const handleDisconnect = () => setDisconnected(true)
    const handleConnect = () => setDisconnected(false)

    socket.on('disconnect', handleDisconnect)
    socket.on('connect', handleConnect)

    return () => {
      socket.off('disconnect', handleDisconnect)
      socket.off('connect', handleConnect)
    }
  }, [socket])

  if (!disconnected) return null

  return (
    <div className="fixed top-0 right-0 left-0 z-50 animate-pulse bg-amber-500 px-4 py-2.5 text-center text-sm font-bold text-white shadow-md">
      No connection — trying to reconnect...
    </div>
  )
}
