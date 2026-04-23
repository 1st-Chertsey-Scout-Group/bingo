'use client'

import { memo, useEffect, useRef, useState } from 'react'
import { Camera, CircleAlert, MapPin, Radio, Trophy } from 'lucide-react'

import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { LOG_CATEGORY, type LogCategory, type LogEntry } from '@/types'

const CATEGORY_META: Record<
  LogCategory,
  { label: string; icon: typeof Camera; colour: string; activeColour: string }
> = {
  [LOG_CATEGORY.SUBMISSION]: {
    label: 'Submissions',
    icon: Camera,
    colour: 'text-blue-400',
    activeColour: 'bg-blue-100 text-blue-700 border-blue-300',
  },
  [LOG_CATEGORY.CONNECTION]: {
    label: 'Connections',
    icon: Radio,
    colour: 'text-green-400',
    activeColour: 'bg-green-100 text-green-700 border-green-300',
  },
  [LOG_CATEGORY.ERROR]: {
    label: 'Errors',
    icon: CircleAlert,
    colour: 'text-red-400',
    activeColour: 'bg-red-100 text-red-700 border-red-300',
  },
  [LOG_CATEGORY.GAME_STATE]: {
    label: 'Game',
    icon: Trophy,
    colour: 'text-amber-400',
    activeColour: 'bg-amber-100 text-amber-700 border-amber-300',
  },
  [LOG_CATEGORY.LOCATION]: {
    label: 'Location',
    icon: MapPin,
    colour: 'text-purple-400',
    activeColour: 'bg-purple-100 text-purple-700 border-purple-300',
  },
}

const ALL_CATEGORIES = Object.values(LOG_CATEGORY)

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

const LogRow = memo(function LogRow({ entry }: { entry: LogEntry }) {
  const meta = CATEGORY_META[entry.category]
  const Icon = meta.icon

  return (
    <div className="flex items-start gap-2 py-1 text-sm">
      <span className="text-muted-foreground shrink-0 font-mono text-xs leading-5">
        {formatTime(entry.timestamp)}
      </span>
      <Icon className={cn('mt-0.5 h-3.5 w-3.5 shrink-0', meta.colour)} />
      {entry.teamColour && (
        <span
          className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: entry.teamColour }}
        />
      )}
      <span className="min-w-0 leading-5">
        {entry.teamName && (
          <span className="font-semibold">{entry.teamName} </span>
        )}
        <span className="text-muted-foreground">{entry.message}</span>
      </span>
    </div>
  )
})

type LogPanelProps = {
  entries: LogEntry[]
}

export const LogPanel = memo(function LogPanel({ entries }: LogPanelProps) {
  const [activeFilters, setActiveFilters] = useState<Set<LogCategory>>(
    () => new Set(ALL_CATEGORIES),
  )
  const bottomRef = useRef<HTMLDivElement>(null)
  const shouldAutoScroll = useRef(true)
  const observerRef = useRef<IntersectionObserver | null>(null)

  // Track whether user is scrolled to bottom
  useEffect(() => {
    const el = bottomRef.current
    if (!el) return

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        shouldAutoScroll.current = entry.isIntersecting
      },
      { threshold: 0.1 },
    )
    observerRef.current.observe(el)

    return () => {
      observerRef.current?.disconnect()
    }
  }, [])

  // Auto-scroll on new entries
  useEffect(() => {
    if (shouldAutoScroll.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [entries.length])

  const toggleFilter = (category: LogCategory) => {
    setActiveFilters((prev) => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  const filtered = entries.filter((e) => activeFilters.has(e.category))

  return (
    <div className="flex h-full flex-col">
      {/* Filter bar */}
      <div className="flex gap-1.5 overflow-x-auto border-b px-3 py-2">
        {ALL_CATEGORIES.map((cat) => {
          const meta = CATEGORY_META[cat]
          const active = activeFilters.has(cat)
          return (
            <button
              key={cat}
              onClick={() => toggleFilter(cat)}
              className={cn(
                'flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
                active
                  ? meta.activeColour
                  : 'border-gray-200 bg-gray-50 text-gray-400',
              )}
            >
              <meta.icon className="h-3 w-3" />
              {meta.label}
            </button>
          )
        })}
      </div>

      {/* Log entries */}
      <ScrollArea className="flex-1">
        <div className="px-3 py-1">
          {filtered.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              No log entries yet
            </p>
          ) : (
            filtered.map((entry) => <LogRow key={entry.id} entry={entry} />)
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    </div>
  )
})
