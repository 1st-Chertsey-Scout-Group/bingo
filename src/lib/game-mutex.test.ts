import { describe, expect, it } from 'vitest'

import { withGameMutex } from '@/lib/game-mutex'

describe('withGameMutex', () => {
  it('serialises calls for the same key', async () => {
    const order: string[] = []
    const sleep = (ms: number) =>
      new Promise<void>((resolve) => setTimeout(resolve, ms))

    const a = withGameMutex('game-1', async () => {
      order.push('a-start')
      await sleep(20)
      order.push('a-end')
      return 'a'
    })
    const b = withGameMutex('game-1', async () => {
      order.push('b-start')
      await sleep(5)
      order.push('b-end')
      return 'b'
    })

    const [ra, rb] = await Promise.all([a, b])
    expect(ra).toBe('a')
    expect(rb).toBe('b')
    expect(order).toEqual(['a-start', 'a-end', 'b-start', 'b-end'])
  })

  it('runs independently for different keys', async () => {
    const order: string[] = []
    const sleep = (ms: number) =>
      new Promise<void>((resolve) => setTimeout(resolve, ms))

    const a = withGameMutex('game-a', async () => {
      order.push('a-start')
      await sleep(20)
      order.push('a-end')
    })
    const b = withGameMutex('game-b', async () => {
      order.push('b-start')
      await sleep(5)
      order.push('b-end')
    })

    await Promise.all([a, b])
    expect(order[0]).toBe('a-start')
    expect(order[1]).toBe('b-start')
    expect(order).toContain('a-end')
    expect(order).toContain('b-end')
  })

  it('releases the lock even when the function throws', async () => {
    await expect(
      withGameMutex('game-err', async () => {
        throw new Error('boom')
      }),
    ).rejects.toThrow('boom')

    const result = await withGameMutex('game-err', async () => 'ok')
    expect(result).toBe('ok')
  })
})
