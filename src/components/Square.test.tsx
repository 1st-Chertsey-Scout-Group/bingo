import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'

import { Square } from '@/components/Square'
import type { RoundItem } from '@/types'

function makeRoundItem(overrides: Partial<RoundItem> = {}): RoundItem {
  return {
    roundItemId: 'ri-1',
    displayName: 'Oak Tree',
    claimedByTeamId: null,
    claimedByTeamName: null,
    claimedByTeamColour: null,
    hasPendingSubmissions: false,
    lockedByLeader: null,
    ...overrides,
  }
}

describe('Square', () => {
  it('renders unclaimed square with display name', () => {
    render(
      <Square
        roundItem={makeRoundItem()}
        role="scout"
        isOwnTeam={false}
        onTap={() => {}}
      />,
    )
    expect(screen.getByRole('button')).toHaveTextContent('Oak Tree')
  })

  it('calls onTap when clicked', async () => {
    const user = userEvent.setup()
    const onTap = vi.fn()
    render(
      <Square
        roundItem={makeRoundItem()}
        role="scout"
        isOwnTeam={false}
        onTap={onTap}
      />,
    )
    await user.click(screen.getByRole('button'))
    expect(onTap).toHaveBeenCalledTimes(1)
  })

  it('renders claimed square with team name', () => {
    render(
      <Square
        roundItem={makeRoundItem({
          claimedByTeamId: 't-1',
          claimedByTeamName: 'Foxes',
          claimedByTeamColour: '#ff0000',
        })}
        role="scout"
        isOwnTeam={true}
        onTap={() => {}}
      />,
    )
    expect(screen.getByRole('button')).toHaveTextContent('Foxes')
    expect(screen.getByRole('button')).toHaveTextContent('Oak Tree')
  })

  it('renders pending state', () => {
    render(
      <Square
        roundItem={makeRoundItem()}
        role="scout"
        isOwnTeam={false}
        isPending={true}
        onTap={() => {}}
      />,
    )
    const button = screen.getByRole('button')
    expect(button).toHaveAccessibleName(/pending review/)
  })

  it('renders failed state with retry message', () => {
    render(
      <Square
        roundItem={makeRoundItem()}
        role="scout"
        isOwnTeam={false}
        isFailed={true}
        onTap={() => {}}
      />,
    )
    expect(screen.getByRole('button')).toHaveTextContent(
      "Photo didn't send — tap to try again",
    )
  })

  it('renders locked state for leaders', () => {
    render(
      <Square
        roundItem={makeRoundItem({ lockedByLeader: 'Alice' })}
        role="leader"
        isOwnTeam={false}
        onTap={() => {}}
      />,
    )
    expect(screen.getByRole('button')).toHaveTextContent('Alice')
  })

  it('renders needs-review state for leaders', () => {
    render(
      <Square
        roundItem={makeRoundItem({ hasPendingSubmissions: true })}
        role="leader"
        isOwnTeam={false}
        onTap={() => {}}
      />,
    )
    const button = screen.getByRole('button')
    expect(button.className).toContain('amber')
  })

  it('shows check icon for own team claimed square', () => {
    render(
      <Square
        roundItem={makeRoundItem({
          claimedByTeamId: 't-1',
          claimedByTeamName: 'Foxes',
          claimedByTeamColour: '#ff0000',
        })}
        role="scout"
        isOwnTeam={true}
        onTap={() => {}}
      />,
    )
    expect(screen.getByRole('button').querySelector('svg')).toBeInTheDocument()
  })

  it('shows X icon for other team claimed square', () => {
    render(
      <Square
        roundItem={makeRoundItem({
          claimedByTeamId: 't-2',
          claimedByTeamName: 'Hawks',
          claimedByTeamColour: '#0000ff',
        })}
        role="scout"
        isOwnTeam={false}
        onTap={() => {}}
      />,
    )
    expect(screen.getByRole('button').querySelector('svg')).toBeInTheDocument()
  })
})
