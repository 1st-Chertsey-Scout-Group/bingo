import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  checkAdminPin,
  unauthorizedResponse,
  badRequest,
  notFound,
  conflict,
} from '@/lib/admin'

describe('checkAdminPin', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns true when header matches env var', () => {
    vi.stubEnv('ADMIN_PIN', 'secret123')
    const headers = new Headers({ 'x-admin-pin': 'secret123' })
    expect(checkAdminPin(headers)).toBe(true)
  })

  it('returns false when header does not match', () => {
    vi.stubEnv('ADMIN_PIN', 'secret123')
    const headers = new Headers({ 'x-admin-pin': 'wrong' })
    expect(checkAdminPin(headers)).toBe(false)
  })

  it('returns false when header is absent', () => {
    vi.stubEnv('ADMIN_PIN', 'secret123')
    const headers = new Headers()
    expect(checkAdminPin(headers)).toBe(false)
  })

  it('returns false when ADMIN_PIN env var is not set', () => {
    vi.stubEnv('ADMIN_PIN', '')
    const headers = new Headers({ 'x-admin-pin': 'anything' })
    expect(checkAdminPin(headers)).toBe(false)
  })
})

describe('response helpers', () => {
  it('unauthorizedResponse returns 401', async () => {
    const res = unauthorizedResponse()
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Unauthorized')
  })

  it('badRequest returns 400 with message', async () => {
    const res = badRequest('bad input')
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('bad input')
  })

  it('notFound returns 404 with message', async () => {
    const res = notFound('not here')
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('not here')
  })

  it('conflict returns 409 with message', async () => {
    const res = conflict('already exists')
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error).toBe('already exists')
  })
})
