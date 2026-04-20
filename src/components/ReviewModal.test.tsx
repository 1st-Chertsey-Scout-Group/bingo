import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'

import { ReviewModal } from '@/components/ReviewModal'
import type { SubmissionForReview } from '@/types'

const submission: SubmissionForReview = {
  submissionId: 's-1',
  roundItemId: 'ri-1',
  displayName: 'Oak Tree',
  photoUrl: 'https://example.com/photo.jpg',
  teamId: 't-1',
  teamName: 'Foxes',
  teamColour: '#ff0000',
}

describe('ReviewModal', () => {
  it('renders nothing when closed', () => {
    render(
      <ReviewModal
        submission={submission}
        open={false}
        onApprove={() => {}}
        onReject={() => {}}
        onDismiss={() => {}}
      />,
    )
    expect(screen.queryByText('Foxes')).not.toBeInTheDocument()
  })

  it('shows team name and item name when open', () => {
    render(
      <ReviewModal
        submission={submission}
        open={true}
        onApprove={() => {}}
        onReject={() => {}}
        onDismiss={() => {}}
      />,
    )
    expect(screen.getByText('Foxes')).toBeInTheDocument()
    expect(screen.getByText('Oak Tree')).toBeInTheDocument()
  })

  it('shows the photo', () => {
    render(
      <ReviewModal
        submission={submission}
        open={true}
        onApprove={() => {}}
        onReject={() => {}}
        onDismiss={() => {}}
      />,
    )
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg')
    expect(img).toHaveAttribute('alt', 'Oak Tree')
  })

  it('calls onApprove with submissionId when Approve clicked', async () => {
    const user = userEvent.setup()
    const onApprove = vi.fn()

    render(
      <ReviewModal
        submission={submission}
        open={true}
        onApprove={onApprove}
        onReject={() => {}}
        onDismiss={() => {}}
      />,
    )

    await user.click(screen.getByRole('button', { name: /approve/i }))
    expect(onApprove).toHaveBeenCalledWith('s-1')
  })

  it('calls onReject with submissionId when Reject clicked', async () => {
    const user = userEvent.setup()
    const onReject = vi.fn()

    render(
      <ReviewModal
        submission={submission}
        open={true}
        onApprove={() => {}}
        onReject={onReject}
        onDismiss={() => {}}
      />,
    )

    await user.click(screen.getByRole('button', { name: /reject/i }))
    expect(onReject).toHaveBeenCalledWith('s-1')
  })
})
