'use client'

import { useCallback, useRef, useState } from 'react'

import type { LogEntry } from '@/types'

const MAX_ENTRIES = 500

type NewEntry = Omit<LogEntry, 'id' | 'timestamp'>

export type AddLogEntry = (entry: NewEntry) => void

export function useActivityLog() {
  const [entries, setEntries] = useState<LogEntry[]>([])
  const counterRef = useRef(0)

  const addEntry: AddLogEntry = useCallback((entry: NewEntry) => {
    counterRef.current += 1
    const newEntry: LogEntry = {
      ...entry,
      id: `log-${counterRef.current}-${Date.now()}`,
      timestamp: Date.now(),
    }
    setEntries((prev) => {
      const next = [...prev, newEntry]
      return next.length > MAX_ENTRIES ? next.slice(-MAX_ENTRIES) : next
    })
  }, [])

  const clearEntries = useCallback(() => {
    setEntries([])
  }, [])

  return { entries, addEntry, clearEntries }
}
