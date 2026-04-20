import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the useSocket hook
const mockSocket = {
  connected: true,
  on: vi.fn(),
  off: vi.fn(),
  io: {
    on: vi.fn(),
    off: vi.fn(),
  },
}

vi.mock('@/hooks/useSocket', () => ({
  useSocket: () => mockSocket,
}))

import { ConnectionBanner, ConnectionDot } from '@/components/ConnectionBanner'

beforeEach(() => {
  vi.clearAllMocks()
  mockSocket.connected = true
})

describe('ConnectionBanner', () => {
  it('renders nothing when connected', () => {
    const { container } = render(<ConnectionBanner />)
    expect(container.firstChild).toBeNull()
  })

  it('shows disconnected message when socket disconnects', () => {
    mockSocket.connected = false
    render(<ConnectionBanner />)
    expect(screen.getByText(/disconnected/i)).toBeInTheDocument()
  })

  it('shows reconnecting message when reconnect attempt fires', () => {
    mockSocket.connected = false
    render(<ConnectionBanner />)

    // Find the reconnect_attempt handler and call it
    const reconnectCall = mockSocket.io.on.mock.calls.find(
      (call: [string, () => void]) => call[0] === 'reconnect_attempt',
    )
    if (reconnectCall) {
      act(() => {
        reconnectCall[1]()
      })
    }

    expect(screen.getByText(/reconnecting/i)).toBeInTheDocument()
  })

  it('registers and cleans up event listeners', () => {
    const { unmount } = render(<ConnectionBanner />)

    expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function))
    expect(mockSocket.on).toHaveBeenCalledWith(
      'disconnect',
      expect.any(Function),
    )
    expect(mockSocket.io.on).toHaveBeenCalledWith(
      'reconnect_attempt',
      expect.any(Function),
    )

    unmount()

    expect(mockSocket.off).toHaveBeenCalledWith('connect', expect.any(Function))
    expect(mockSocket.off).toHaveBeenCalledWith(
      'disconnect',
      expect.any(Function),
    )
    expect(mockSocket.io.off).toHaveBeenCalledWith(
      'reconnect_attempt',
      expect.any(Function),
    )
  })
})

describe('ConnectionDot', () => {
  it('shows connected state with green dot', () => {
    mockSocket.connected = true
    render(<ConnectionDot />)
    expect(screen.getByText('Connected')).toBeInTheDocument()
  })

  it('shows disconnected state with red dot', () => {
    mockSocket.connected = false
    render(<ConnectionDot />)
    expect(screen.getByText('Disconnected')).toBeInTheDocument()
  })

  it('transitions to reconnecting state', () => {
    mockSocket.connected = false
    render(<ConnectionDot />)

    const reconnectCall = mockSocket.io.on.mock.calls.find(
      (call: [string, () => void]) => call[0] === 'reconnect_attempt',
    )
    if (reconnectCall) {
      act(() => {
        reconnectCall[1]()
      })
    }

    expect(screen.getByText('Reconnecting')).toBeInTheDocument()
  })

  it('transitions back to connected', () => {
    mockSocket.connected = false
    render(<ConnectionDot />)

    const connectCall = mockSocket.on.mock.calls.find(
      (call: [string, () => void]) => call[0] === 'connect',
    )
    if (connectCall) {
      act(() => {
        connectCall[1]()
      })
    }

    expect(screen.getByText('Connected')).toBeInTheDocument()
  })
})
