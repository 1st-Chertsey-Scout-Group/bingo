'use client'

import { useCallback, useSyncExternalStore } from 'react'

import { cn } from '@/lib/utils'
import { useSocket } from '@/hooks/useSocket'

type Status = 'connected' | 'reconnecting' | 'disconnected'

function useConnectionStatus(socket: ReturnType<typeof useSocket>): Status {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!socket) return () => {}

      socket.on('connect', onStoreChange)
      socket.on('disconnect', onStoreChange)
      socket.io.on('reconnect_attempt', onStoreChange)
      window.addEventListener('online', onStoreChange)
      window.addEventListener('offline', onStoreChange)

      return () => {
        socket.off('connect', onStoreChange)
        socket.off('disconnect', onStoreChange)
        socket.io.off('reconnect_attempt', onStoreChange)
        window.removeEventListener('online', onStoreChange)
        window.removeEventListener('offline', onStoreChange)
      }
    },
    [socket],
  )

  const getSnapshot = useCallback((): Status => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return 'disconnected'
    }
    if (!socket) return 'disconnected'
    if (socket.connected) return 'connected'
    if (socket.active) return 'reconnecting'
    return 'disconnected'
  }, [socket])

  return useSyncExternalStore(subscribe, getSnapshot, () => 'disconnected')
}

export function ConnectionDot() {
  const socket = useSocket()
  const status = useConnectionStatus(socket)

  if (status === 'connected') {
    return (
      <span
        className="inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-green-500"
        aria-label="Connected"
      />
    )
  }

  if (status === 'reconnecting') {
    return (
      <span
        className={cn(
          'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-semibold',
          'animate-pulse bg-amber-100 text-amber-700',
        )}
        aria-label="Reconnecting"
      >
        Reconnecting
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-semibold',
        'bg-red-100 text-red-700',
      )}
      aria-label="Disconnected"
    >
      Offline
    </span>
  )
}
