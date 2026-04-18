'use client'

import { useEffect, useState } from 'react'

export function useElapsedTime(roundStartedAt: string): number {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const startTime = new Date(roundStartedAt).getTime()

    const tick = () => {
      const now = Date.now()
      setElapsed(Math.floor((now - startTime) / 1000))
    }

    tick()
    const interval = setInterval(tick, 1000)

    return () => clearInterval(interval)
  }, [roundStartedAt])

  return elapsed
}
