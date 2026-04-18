'use client'

import { useEffect, useState } from 'react'
import type { Socket } from 'socket.io-client'
import type { TeamPosition } from '@/types'

export function useTeamPositions(socket: Socket | null): TeamPosition[] {
  const [positions, setPositions] = useState<TeamPosition[]>([])

  useEffect(() => {
    if (!socket) return

    const handler = (payload: { positions: TeamPosition[] }) => {
      setPositions(payload.positions)
    }

    socket.on('location:positions', handler)

    return () => {
      socket.off('location:positions', handler)
    }
  }, [socket])

  return positions
}
