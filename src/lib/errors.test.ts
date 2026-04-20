import { describe, it, expect } from 'vitest'
import { getErrorMessage } from '@/lib/errors'

describe('getErrorMessage', () => {
  it('returns message from an Error instance', () => {
    expect(getErrorMessage(new Error('fail'))).toBe('fail')
  })

  it('returns string for a string input', () => {
    expect(getErrorMessage('oops')).toBe('oops')
  })

  it('returns string representation of a number', () => {
    expect(getErrorMessage(42)).toBe('42')
  })

  it('returns string representation of null', () => {
    expect(getErrorMessage(null)).toBe('null')
  })

  it('returns string representation of undefined', () => {
    expect(getErrorMessage(undefined)).toBe('undefined')
  })
})
