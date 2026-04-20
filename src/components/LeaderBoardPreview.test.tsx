import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'

import { LeaderBoardPreview } from '@/components/LeaderBoardPreview'
import type { BoardItem } from '@/types'

function makeBoard(count: number): BoardItem[] {
  return Array.from({ length: count }, (_, i) => ({
    itemId: `item-${String(i)}`,
    displayName: `Item ${String(i)}`,
  }))
}

describe('LeaderBoardPreview', () => {
  it('renders all board items', () => {
    const board = makeBoard(9)
    render(
      <LeaderBoardPreview
        previewBoard={board}
        teamCount={2}
        enabledCategories={[]}
        onRegenerate={() => {}}
      />,
    )
    for (let i = 0; i < 9; i++) {
      expect(screen.getByText(`Item ${String(i)}`)).toBeInTheDocument()
    }
  })

  it('shows Board Preview heading', () => {
    render(
      <LeaderBoardPreview
        previewBoard={makeBoard(9)}
        teamCount={2}
        enabledCategories={[]}
        onRegenerate={() => {}}
      />,
    )
    expect(screen.getByText('Board Preview')).toBeInTheDocument()
  })

  it('calls onRefreshItem when a square is tapped', async () => {
    const user = userEvent.setup()
    const onRefreshItem = vi.fn()
    const cats = ['trees-plants']

    render(
      <LeaderBoardPreview
        previewBoard={makeBoard(9)}
        teamCount={2}
        enabledCategories={cats}
        onRefreshItem={onRefreshItem}
        onRegenerate={() => {}}
      />,
    )

    await user.click(screen.getByText('Item 3'))
    expect(onRefreshItem).toHaveBeenCalledWith(3, cats)
  })

  it('calls onRegenerate when Regenerate is clicked', async () => {
    const user = userEvent.setup()
    const onRegenerate = vi.fn()

    render(
      <LeaderBoardPreview
        previewBoard={makeBoard(9)}
        teamCount={2}
        enabledCategories={[]}
        onRegenerate={onRegenerate}
      />,
    )

    await user.click(screen.getByRole('button', { name: /regenerate/i }))
    expect(onRegenerate).toHaveBeenCalledTimes(1)
  })

  it('calls onClearPreview when Back is clicked', async () => {
    const user = userEvent.setup()
    const onClearPreview = vi.fn()

    render(
      <LeaderBoardPreview
        previewBoard={makeBoard(9)}
        teamCount={2}
        enabledCategories={[]}
        onClearPreview={onClearPreview}
        onRegenerate={() => {}}
      />,
    )

    await user.click(screen.getByRole('button', { name: /back/i }))
    expect(onClearPreview).toHaveBeenCalledTimes(1)
  })

  it('calls onStartRound when Start Round is clicked', async () => {
    const user = userEvent.setup()
    const onStartRound = vi.fn()

    render(
      <LeaderBoardPreview
        previewBoard={makeBoard(9)}
        teamCount={2}
        enabledCategories={[]}
        onStartRound={onStartRound}
        onRegenerate={() => {}}
      />,
    )

    await user.click(screen.getByRole('button', { name: /start round/i }))
    expect(onStartRound).toHaveBeenCalledTimes(1)
  })

  it('disables Start Round when no teams', () => {
    render(
      <LeaderBoardPreview
        previewBoard={makeBoard(9)}
        teamCount={0}
        enabledCategories={[]}
        onRegenerate={() => {}}
      />,
    )

    expect(screen.getByRole('button', { name: /start round/i })).toBeDisabled()
    expect(
      screen.getByText('Need at least 1 team to start'),
    ).toBeInTheDocument()
  })
})
