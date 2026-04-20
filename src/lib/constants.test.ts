import { describe, it, expect } from 'vitest'
import { isValidPin } from '@/lib/constants'

describe('isValidPin', () => {
  it('returns true for 4-digit string', () => {
    expect(isValidPin('1234')).toBe(true)
    expect(isValidPin('0000')).toBe(true)
    expect(isValidPin('9999')).toBe(true)
  })

  it('returns false for too-short string', () => {
    expect(isValidPin('123')).toBe(false)
    expect(isValidPin('')).toBe(false)
  })

  it('returns false for too-long string', () => {
    expect(isValidPin('12345')).toBe(false)
  })

  it('returns false for non-digit characters', () => {
    expect(isValidPin('abcd')).toBe(false)
    expect(isValidPin('12 4')).toBe(false)
    expect(isValidPin('12.4')).toBe(false)
  })
})
