import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'

import { UploadOverlay } from '@/components/UploadOverlay'

describe('UploadOverlay', () => {
  it('shows compressing stage label', () => {
    render(<UploadOverlay stage="compressing" onCancel={() => {}} />)
    expect(screen.getByText('Compressing photo...')).toBeInTheDocument()
  })

  it('shows uploading stage label', () => {
    render(<UploadOverlay stage="uploading" onCancel={() => {}} />)
    expect(screen.getByText('Uploading...')).toBeInTheDocument()
  })

  it('shows submitting stage label', () => {
    render(<UploadOverlay stage="submitting" onCancel={() => {}} />)
    expect(screen.getByText('Submitting...')).toBeInTheDocument()
  })

  it('calls onCancel when cancel button clicked', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    render(<UploadOverlay stage="uploading" onCancel={onCancel} />)

    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('has status role for accessibility', () => {
    render(<UploadOverlay stage="uploading" onCancel={() => {}} />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})
