import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'

import { ScoutLobby } from '@/components/ScoutLobby'

describe('ScoutLobby', () => {
  it('shows the current team name when assigned', () => {
    render(
      <ScoutLobby
        myTeam={{ name: 'Foxes', colour: '#ff0000' }}
        teams={[{ id: 't-1', name: 'Foxes', colour: '#ff0000' }]}
      />,
    )
    expect(screen.getByText('Foxes')).toBeInTheDocument()
    expect(screen.getByText('You are')).toBeInTheDocument()
  })

  it('shows how to play instructions', () => {
    render(<ScoutLobby myTeam={null} teams={[]} />)
    expect(screen.getByText('How to Play')).toBeInTheDocument()
  })

  it('shows waiting message', () => {
    render(<ScoutLobby myTeam={null} teams={[]} />)
    expect(
      screen.getByText('Waiting for the leader to start...'),
    ).toBeInTheDocument()
  })

  it('renders team selection buttons', () => {
    render(<ScoutLobby myTeam={null} teams={[]} onSwitchTeam={() => {}} />)
    expect(screen.getByText('Choose Your Team')).toBeInTheDocument()
  })

  it('calls onSwitchTeam when a team is clicked', async () => {
    const user = userEvent.setup()
    const onSwitch = vi.fn()

    render(<ScoutLobby myTeam={null} teams={[]} onSwitchTeam={onSwitch} />)

    // Click the first available team button
    const buttons = screen.getAllByRole('button')
    await user.click(buttons[0])
    expect(onSwitch).toHaveBeenCalledTimes(1)
  })

  it('shows teams locked overlay when locked', () => {
    render(
      <ScoutLobby
        myTeam={{ name: 'Foxes', colour: '#ff0000' }}
        teams={[{ id: 't-1', name: 'Foxes', colour: '#ff0000' }]}
        teamsLocked={true}
      />,
    )
    expect(screen.getByText('Teams locked by leader')).toBeInTheDocument()
  })
})
