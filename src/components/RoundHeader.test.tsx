import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

// Mock useSocket for ConnectionDot
vi.mock('@/hooks/useSocket', () => ({
  useSocket: () => ({
    connected: true,
    on: vi.fn(),
    off: vi.fn(),
    io: { on: vi.fn(), off: vi.fn() },
  }),
}))

// Mock useElapsedTime to return a fixed value
vi.mock('@/hooks/useElapsedTime', () => ({
  useElapsedTime: () => 125,
}))

import { RoundHeader } from '@/components/RoundHeader'
import type { RoundItem } from '@/types'

function makeItem(claimed: boolean): RoundItem {
  return {
    roundItemId: `ri-${String(Math.random())}`,
    displayName: 'Item',
    claimedByTeamId: claimed ? 't-1' : null,
    claimedByTeamName: claimed ? 'Foxes' : null,
    claimedByTeamColour: claimed ? '#ff0000' : null,
    hasPendingSubmissions: false,
    lockedByLeader: null,
  }
}

describe('RoundHeader', () => {
  it('shows elapsed time', () => {
    render(
      <RoundHeader
        roundStartedAt="2026-01-01T00:00:00Z"
        board={[]}
        onEndRound={() => {}}
      />,
    )
    expect(screen.getByText('02:05')).toBeInTheDocument()
  })

  it('shows claimed/total count', () => {
    const board = [makeItem(true), makeItem(true), makeItem(false)]
    render(
      <RoundHeader
        roundStartedAt="2026-01-01T00:00:00Z"
        board={board}
        onEndRound={() => {}}
      />,
    )
    expect(screen.getByText('2/3')).toBeInTheDocument()
  })

  it('shows End Round button', () => {
    render(
      <RoundHeader
        roundStartedAt="2026-01-01T00:00:00Z"
        board={[]}
        onEndRound={() => {}}
      />,
    )
    expect(
      screen.getByRole('button', { name: /end round/i }),
    ).toBeInTheDocument()
  })

  it('shows map toggle when onToggleMap provided', () => {
    const onToggleMap = vi.fn()
    render(
      <RoundHeader
        roundStartedAt="2026-01-01T00:00:00Z"
        board={[]}
        onEndRound={() => {}}
        onToggleMap={onToggleMap}
      />,
    )
    // The map button has a MapPin icon
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThanOrEqual(2)
  })

  it('shows connection status dot', () => {
    render(
      <RoundHeader
        roundStartedAt="2026-01-01T00:00:00Z"
        board={[]}
        onEndRound={() => {}}
      />,
    )
    expect(screen.getByText('Connected')).toBeInTheDocument()
  })
})
