import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'

import { SquareDetailDialog } from '@/components/SquareDetailDialog'

describe('SquareDetailDialog', () => {
  it('renders nothing when closed', () => {
    render(
      <SquareDetailDialog
        displayName="Oak Tree"
        open={false}
        onOpenChange={() => {}}
        onTakePhoto={() => {}}
      />,
    )
    expect(screen.queryByText('Oak Tree')).not.toBeInTheDocument()
  })

  it('shows the full item name when open', () => {
    render(
      <SquareDetailDialog
        displayName="A Very Long Nature Item Name That Gets Truncated On The Board"
        open={true}
        onOpenChange={() => {}}
        onTakePhoto={() => {}}
      />,
    )
    expect(
      screen.getByText(
        'A Very Long Nature Item Name That Gets Truncated On The Board',
      ),
    ).toBeInTheDocument()
  })

  it('shows Take Photo button when open', () => {
    render(
      <SquareDetailDialog
        displayName="Oak Tree"
        open={true}
        onOpenChange={() => {}}
        onTakePhoto={() => {}}
      />,
    )
    expect(
      screen.getByRole('button', { name: /take photo/i }),
    ).toBeInTheDocument()
  })

  it('calls onTakePhoto and closes when Take Photo is clicked', async () => {
    const user = userEvent.setup()
    const onTakePhoto = vi.fn()
    const onOpenChange = vi.fn()

    render(
      <SquareDetailDialog
        displayName="Oak Tree"
        open={true}
        onOpenChange={onOpenChange}
        onTakePhoto={onTakePhoto}
      />,
    )

    await user.click(screen.getByRole('button', { name: /take photo/i }))
    expect(onTakePhoto).toHaveBeenCalledTimes(1)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
