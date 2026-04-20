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
  useElapsedTime: () => 65,
}))

import { ScoutHeader } from '@/components/ScoutHeader'
import type { RoundItem } from '@/types'

function makeItem(claimedByTeamId: string | null = null): RoundItem {
  return {
    roundItemId: `ri-${String(Math.random())}`,
    displayName: 'Item',
    claimedByTeamId,
    claimedByTeamName: claimedByTeamId ? 'Foxes' : null,
    claimedByTeamColour: claimedByTeamId ? '#ff0000' : null,
    hasPendingSubmissions: false,
    lockedByLeader: null,
  }
}

describe('ScoutHeader', () => {
  it('shows elapsed time', () => {
    render(
      <ScoutHeader
        roundStartedAt="2026-01-01T00:00:00Z"
        board={[]}
        myTeamId={null}
        myTeamColour={null}
        teams={[]}
      />,
    )
    expect(screen.getByText('01:05')).toBeInTheDocument()
  })

  it('shows remaining count', () => {
    const board = [makeItem('t-1'), makeItem(null), makeItem(null)]
    render(
      <ScoutHeader
        roundStartedAt="2026-01-01T00:00:00Z"
        board={board}
        myTeamId="t-1"
        myTeamColour="#ff0000"
        teams={[{ id: 't-1', name: 'Foxes', colour: '#ff0000' }]}
      />,
    )
    expect(screen.getByText('2 left')).toBeInTheDocument()
  })

  it('shows own team claimed count', () => {
    const board = [makeItem('t-1'), makeItem('t-1'), makeItem(null)]
    render(
      <ScoutHeader
        roundStartedAt="2026-01-01T00:00:00Z"
        board={board}
        myTeamId="t-1"
        myTeamColour="#ff0000"
        teams={[{ id: 't-1', name: 'Foxes', colour: '#ff0000' }]}
      />,
    )
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('shows position when team exists', () => {
    const board = [makeItem('t-1')]
    render(
      <ScoutHeader
        roundStartedAt="2026-01-01T00:00:00Z"
        board={board}
        myTeamId="t-1"
        myTeamColour="#ff0000"
        teams={[{ id: 't-1', name: 'Foxes', colour: '#ff0000' }]}
      />,
    )
    expect(screen.getByText('1st')).toBeInTheDocument()
  })

  it('shows connection status dot', () => {
    render(
      <ScoutHeader
        roundStartedAt="2026-01-01T00:00:00Z"
        board={[]}
        myTeamId={null}
        myTeamColour={null}
        teams={[]}
      />,
    )
    expect(screen.getByText('Connected')).toBeInTheDocument()
  })
})
