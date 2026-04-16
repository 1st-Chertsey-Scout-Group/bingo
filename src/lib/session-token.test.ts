import { describe, expect, it } from 'vitest'

import {
  generateSessionToken,
  hashSessionToken,
  verifySessionToken,
} from '@/lib/session-token'

describe('session-token', () => {
  it('generates a hex string of 64 chars (32 bytes)', () => {
    const token = generateSessionToken()
    expect(token).toMatch(/^[0-9a-f]{64}$/)
  })

  it('generates distinct tokens on repeated calls', () => {
    const a = generateSessionToken()
    const b = generateSessionToken()
    expect(a).not.toBe(b)
  })

  it('hashes deterministically', () => {
    const token = 'abc'
    expect(hashSessionToken(token)).toBe(hashSessionToken(token))
  })

  it('verifies a valid token against its hash', () => {
    const token = generateSessionToken()
    const hash = hashSessionToken(token)
    expect(verifySessionToken(token, hash)).toBe(true)
  })

  it('rejects a mismatched token', () => {
    const token = generateSessionToken()
    const hash = hashSessionToken(token)
    const other = generateSessionToken()
    expect(verifySessionToken(other, hash)).toBe(false)
  })

  it('rejects malformed expected hash without throwing', () => {
    const token = generateSessionToken()
    expect(verifySessionToken(token, 'not-a-hash')).toBe(false)
    expect(verifySessionToken(token, '')).toBe(false)
  })
})
