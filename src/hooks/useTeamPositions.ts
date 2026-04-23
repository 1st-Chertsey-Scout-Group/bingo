'use client'

import { useEffect, useRef, useState } from 'react'
import type { Socket } from 'socket.io-client'

import type { AddLogEntry } from '@/hooks/useActivityLog'
import { LOG_CATEGORY } from '@/types'
import type { TeamPosition } from '@/types'

const LOCATION_LOG_THROTTLE_MS = 30_000

export function useTeamPositions(
  socket: Socket | null,
  addLogEntry?: AddLogEntry,
): TeamPosition[] {
  const [positions, setPositions] = useState<TeamPosition[]>([])
  const lastLoggedRef = useRef(0)

  useEffect(() => {
    if (!socket) return

    const handler = (payload: { positions: TeamPosition[] }) => {
      setPositions(payload.positions)

      const now = Date.now()
      if (
        addLogEntry &&
        now - lastLoggedRef.current > LOCATION_LOG_THROTTLE_MS
      ) {
        lastLoggedRef.current = now
        addLogEntry({
          category: LOG_CATEGORY.LOCATION,
          teamName: null,
          teamColour: null,
          message: `Location update (${payload.positions.length} ${payload.positions.length === 1 ? 'team' : 'teams'})`,
        })
      }
    }

    socket.on('location:positions', handler)

    return () => {
      socket.off('location:positions', handler)
    }
  }, [socket, addLogEntry])

  return positions
}
