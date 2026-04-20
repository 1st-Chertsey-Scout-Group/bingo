import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'

import { LeaderLobbyConfig } from '@/components/LeaderLobbyConfig'

describe('LeaderLobbyConfig', () => {
  it('renders scout and leader PINs', () => {
    render(<LeaderLobbyConfig teams={[]} gamePin="1234" leaderPin="5678" />)
    expect(screen.getByText('1234')).toBeInTheDocument()
    expect(screen.getByText('5678')).toBeInTheDocument()
  })

  it('shows team count', () => {
    render(
      <LeaderLobbyConfig
        teams={[{ id: 't-1', name: 'Foxes', colour: '#ff0000' }]}
        gamePin="1234"
        leaderPin="5678"
      />,
    )
    expect(screen.getByText('Teams Joined (1)')).toBeInTheDocument()
  })

  it('shows waiting message when no teams', () => {
    render(<LeaderLobbyConfig teams={[]} gamePin="1234" leaderPin="5678" />)
    expect(
      screen.getByText('Waiting for scouts to join...'),
    ).toBeInTheDocument()
  })

  it('disables Preview Board when no teams', () => {
    render(<LeaderLobbyConfig teams={[]} gamePin="1234" leaderPin="5678" />)
    expect(
      screen.getByRole('button', { name: /preview board/i }),
    ).toBeDisabled()
  })

  it('enables Preview Board when teams exist', () => {
    render(
      <LeaderLobbyConfig
        teams={[{ id: 't-1', name: 'Foxes', colour: '#ff0000' }]}
        gamePin="1234"
        leaderPin="5678"
      />,
    )
    expect(screen.getByRole('button', { name: /preview board/i })).toBeEnabled()
  })

  it('calls onPreviewBoard with categories, board size, template count', async () => {
    const user = userEvent.setup()
    const onPreviewBoard = vi.fn()

    render(
      <LeaderLobbyConfig
        teams={[{ id: 't-1', name: 'Foxes', colour: '#ff0000' }]}
        gamePin="1234"
        leaderPin="5678"
        onPreviewBoard={onPreviewBoard}
      />,
    )

    await user.click(screen.getByRole('button', { name: /preview board/i }))
    expect(onPreviewBoard).toHaveBeenCalledTimes(1)
    const [categories, boardSize, templateCount] = onPreviewBoard.mock.calls[0]
    expect(Array.isArray(categories)).toBe(true)
    expect(typeof boardSize).toBe('number')
    expect(typeof templateCount).toBe('number')
  })

  it('toggles team lock', async () => {
    const user = userEvent.setup()
    const onToggleTeamLock = vi.fn()

    render(
      <LeaderLobbyConfig
        teams={[]}
        gamePin="1234"
        leaderPin="5678"
        teamsLocked={false}
        onToggleTeamLock={onToggleTeamLock}
      />,
    )

    await user.click(screen.getByRole('button', { name: /lock teams/i }))
    expect(onToggleTeamLock).toHaveBeenCalledWith(true)
  })

  it('renders End Game button when onEndGame is provided', () => {
    render(
      <LeaderLobbyConfig
        teams={[]}
        gamePin="1234"
        leaderPin="5678"
        onEndGame={() => {}}
      />,
    )
    expect(
      screen.getByRole('button', { name: /end game/i }),
    ).toBeInTheDocument()
  })

  it('does not render End Game button when onEndGame is not provided', () => {
    render(<LeaderLobbyConfig teams={[]} gamePin="1234" leaderPin="5678" />)
    expect(
      screen.queryByRole('button', { name: /end game/i }),
    ).not.toBeInTheDocument()
  })

  it('renders category toggle buttons', () => {
    render(<LeaderLobbyConfig teams={[]} gamePin="1234" leaderPin="5678" />)
    expect(screen.getByText('Categories')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /trees & plants/i }),
    ).toBeInTheDocument()
  })

  it('calls onEndGame after dialog confirmation', async () => {
    const user = userEvent.setup()
    const onEndGame = vi.fn()

    render(
      <LeaderLobbyConfig
        teams={[]}
        gamePin="1234"
        leaderPin="5678"
        onEndGame={onEndGame}
      />,
    )

    // Click the End Game trigger button to open dialog
    await user.click(screen.getByRole('button', { name: /end game/i }))

    // Dialog should show confirmation text
    expect(screen.getByText('End this game?')).toBeInTheDocument()

    // Click the destructive End Game button in the dialog
    const buttons = screen.getAllByRole('button', { name: /end game/i })
    const confirmButton = buttons.find((b) =>
      b.className.includes('destructive'),
    )
    if (confirmButton) {
      await user.click(confirmButton)
    }

    expect(onEndGame).toHaveBeenCalledTimes(1)
  })

  it('toggles category off and on', async () => {
    const user = userEvent.setup()

    render(
      <LeaderLobbyConfig
        teams={[{ id: 't-1', name: 'Foxes', colour: '#ff0000' }]}
        gamePin="1234"
        leaderPin="5678"
      />,
    )

    const treesButton = screen.getByRole('button', { name: /trees & plants/i })

    // Click to toggle off
    await user.click(treesButton)

    // Click again to toggle back on
    await user.click(treesButton)

    // Should still be present
    expect(treesButton).toBeInTheDocument()
  })
})
