import { describe, it, expect } from 'vitest'
import { formatElapsed } from '@/lib/format'

describe('formatElapsed', () => {
  it('formats zero seconds', () => {
    expect(formatElapsed(0)).toBe('00:00')
  })

  it('formats seconds under a minute', () => {
    expect(formatElapsed(5)).toBe('00:05')
    expect(formatElapsed(59)).toBe('00:59')
  })

  it('formats exact minutes', () => {
    expect(formatElapsed(60)).toBe('01:00')
    expect(formatElapsed(600)).toBe('10:00')
  })

  it('formats minutes and seconds', () => {
    expect(formatElapsed(61)).toBe('01:01')
    expect(formatElapsed(754)).toBe('12:34')
  })

  it('formats large values with multi-digit minutes', () => {
    expect(formatElapsed(3599)).toBe('59:59')
    expect(formatElapsed(3600)).toBe('60:00')
  })
})
