import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'

import { Board } from '@/components/Board'
import type { RoundItem } from '@/types'

function makeItem(id: string, name: string): RoundItem {
  return {
    roundItemId: id,
    displayName: name,
    claimedByTeamId: null,
    claimedByTeamName: null,
    claimedByTeamColour: null,
    hasPendingSubmissions: false,
    lockedByLeader: null,
  }
}

describe('Board', () => {
  it('renders all items as squares', () => {
    const items = [
      makeItem('ri-1', 'Oak Tree'),
      makeItem('ri-2', 'Robin'),
      makeItem('ri-3', 'Pond'),
    ]
    render(
      <Board
        items={items}
        role="scout"
        myTeamId={null}
        onSquareTap={() => {}}
      />,
    )
    expect(screen.getByText('Oak Tree')).toBeInTheDocument()
    expect(screen.getByText('Robin')).toBeInTheDocument()
    expect(screen.getByText('Pond')).toBeInTheDocument()
  })

  it('has a grid with bingo board aria label', () => {
    render(
      <Board items={[]} role="scout" myTeamId={null} onSquareTap={() => {}} />,
    )
    expect(screen.getByRole('grid')).toHaveAccessibleName('Bingo board')
  })

  it('calls onSquareTap with the correct roundItemId', async () => {
    const user = userEvent.setup()
    const onSquareTap = vi.fn()
    const items = [makeItem('ri-1', 'Oak Tree'), makeItem('ri-2', 'Robin')]

    render(
      <Board
        items={items}
        role="scout"
        myTeamId={null}
        onSquareTap={onSquareTap}
      />,
    )

    await user.click(screen.getByText('Robin'))
    expect(onSquareTap).toHaveBeenCalledWith('ri-2')
  })

  it('marks pending items correctly', () => {
    const items = [makeItem('ri-1', 'Oak Tree')]
    const pendingItems = new Set(['ri-1'])

    render(
      <Board
        items={items}
        role="scout"
        myTeamId={null}
        pendingItems={pendingItems}
        onSquareTap={() => {}}
      />,
    )

    expect(screen.getByRole('button')).toHaveAccessibleName(/pending review/)
  })

  it('marks failed item correctly', () => {
    const items = [makeItem('ri-1', 'Oak Tree')]

    render(
      <Board
        items={items}
        role="scout"
        myTeamId={null}
        failedItemId="ri-1"
        onSquareTap={() => {}}
      />,
    )

    expect(screen.getByRole('button')).toHaveTextContent(
      "Photo didn't send — tap to try again",
    )
  })
})
