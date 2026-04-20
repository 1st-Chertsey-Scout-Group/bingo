import { vi } from 'vitest'

export type MockSocket = {
  id: string
  data: Record<string, unknown>
  emit: ReturnType<typeof vi.fn>
  on: ReturnType<typeof vi.fn>
  off: ReturnType<typeof vi.fn>
  join: ReturnType<typeof vi.fn>
  leave: ReturnType<typeof vi.fn>
  rooms: Set<string>
}

export type MockIo = {
  to: ReturnType<typeof vi.fn>
  in: ReturnType<typeof vi.fn>
  on: ReturnType<typeof vi.fn>
  emit: ReturnType<typeof vi.fn>
}

export function createMockSocket(
  data: Record<string, unknown> = {},
): MockSocket {
  return {
    id: 'sock-1',
    data,
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    join: vi.fn(),
    leave: vi.fn(),
    rooms: new Set(['sock-1']),
  }
}

export function createMockIo(): MockIo {
  const emitFn = vi.fn()
  const toObj = { emit: emitFn }
  return {
    to: vi.fn().mockReturnValue(toObj),
    in: vi.fn().mockReturnValue({
      fetchSockets: vi.fn().mockResolvedValue([]),
    }),
    on: vi.fn(),
    emit: emitFn,
  }
}

/**
 * Extract a registered socket handler by event name.
 * Call after registerXxxHandlers(io, socket).
 */
export function getHandler(
  socket: MockSocket,
  event: string,
): (...args: unknown[]) => Promise<void> {
  const call = socket.on.mock.calls.find(
    (c: [string, (...args: unknown[]) => Promise<void>]) => c[0] === event,
  )
  if (!call) throw new Error(`No handler registered for "${event}"`)
  return call[1] as (...args: unknown[]) => Promise<void>
}
