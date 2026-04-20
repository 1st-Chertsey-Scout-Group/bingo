'use client'

import { useEffect, useState } from 'react'
import { useSocket } from '@/hooks/useSocket'

type ConnectionState = 'connected' | 'reconnecting' | 'disconnected'

export function ConnectionBanner() {
  const socket = useSocket()
  const [state, setState] = useState<ConnectionState>(() => {
    if (!socket) return 'connected'
    if (socket.connected) return 'connected'
    return 'disconnected'
  })

  useEffect(() => {
    if (!socket) return

    const handleConnect = () => setState('connected')
    const handleDisconnect = () => setState('disconnected')
    const handleReconnectAttempt = () => setState('reconnecting')

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.io.on('reconnect_attempt', handleReconnectAttempt)

    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.io.off('reconnect_attempt', handleReconnectAttempt)
    }
  }, [socket])

  if (state === 'connected') return null

  return (
    <div
      className={`fixed top-0 right-0 left-0 z-50 px-4 py-2.5 text-center text-sm font-bold text-white shadow-md ${
        state === 'reconnecting' ? 'animate-pulse bg-amber-500' : 'bg-red-500'
      }`}
    >
      {state === 'reconnecting'
        ? 'Reconnecting...'
        : 'Disconnected — trying to reconnect...'}
    </div>
  )
}

export function ConnectionDot() {
  const socket = useSocket()
  const [state, setState] = useState<ConnectionState>(() => {
    if (!socket) return 'connected'
    if (socket.connected) return 'connected'
    return 'disconnected'
  })

  useEffect(() => {
    if (!socket) return

    const handleConnect = () => setState('connected')
    const handleDisconnect = () => setState('disconnected')
    const handleReconnectAttempt = () => setState('reconnecting')

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.io.on('reconnect_attempt', handleReconnectAttempt)

    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.io.off('reconnect_attempt', handleReconnectAttempt)
    }
  }, [socket])

  const color =
    state === 'connected'
      ? 'bg-green-500'
      : state === 'reconnecting'
        ? 'bg-amber-500 animate-pulse'
        : 'bg-red-500'

  const label =
    state === 'connected'
      ? 'Connected'
      : state === 'reconnecting'
        ? 'Reconnecting'
        : 'Disconnected'

  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      <span
        className={`text-xs font-medium ${
          state === 'connected'
            ? 'text-green-600'
            : state === 'reconnecting'
              ? 'text-amber-600'
              : 'text-red-600'
        }`}
      >
        {label}
      </span>
    </span>
  )
}
