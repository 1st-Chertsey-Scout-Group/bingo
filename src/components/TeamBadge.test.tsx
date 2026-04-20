import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import { TeamBadge } from '@/components/TeamBadge'

describe('TeamBadge', () => {
  it('renders the team name', () => {
    render(<TeamBadge name="Foxes" colour="#ff0000" />)
    expect(screen.getByText('Foxes')).toBeInTheDocument()
  })

  it('applies the team colour as background', () => {
    render(<TeamBadge name="Foxes" colour="#ff0000" />)
    expect(screen.getByText('Foxes')).toHaveStyle({
      backgroundColor: '#ff0000',
    })
  })
})
