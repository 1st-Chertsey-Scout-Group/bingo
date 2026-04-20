import { describe, it, expect } from 'vitest'
import { parseBody } from '@/lib/api-validation'

describe('parseBody', () => {
  it('returns ok with data when all required fields are present', () => {
    const body = { name: 'Alice', pin: '1234' }
    const result = parseBody(body, ['name', 'pin'])
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data).toBe(body)
    }
  })

  it('returns ok when requiredFields is empty', () => {
    const result = parseBody({ anything: true }, [])
    expect(result.ok).toBe(true)
  })

  it('returns error when body is null', async () => {
    const result = parseBody(null, ['name'])
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.response.status).toBe(400)
    }
  })

  it('returns error when body is a non-object primitive', async () => {
    const result = parseBody('string', ['name'])
    expect(result.ok).toBe(false)
  })

  it('returns error when a required field is missing', async () => {
    const result = parseBody({ other: 'value' }, ['name'])
    expect(result.ok).toBe(false)
    if (!result.ok) {
      const body = await result.response.json()
      expect(body.error).toBe('name is required')
    }
  })

  it('returns error when a required field is empty string', async () => {
    const result = parseBody({ name: '' }, ['name'])
    expect(result.ok).toBe(false)
    if (!result.ok) {
      const body = await result.response.json()
      expect(body.error).toBe('name is required')
    }
  })

  it('returns error when a required field is whitespace only', async () => {
    const result = parseBody({ name: '   ' }, ['name'])
    expect(result.ok).toBe(false)
  })

  it('returns error when a required field exceeds 200 characters', async () => {
    const result = parseBody({ name: 'a'.repeat(201) }, ['name'])
    expect(result.ok).toBe(false)
    if (!result.ok) {
      const body = await result.response.json()
      expect(body.error).toContain('200 characters')
    }
  })

  it('accepts a field at exactly 200 characters', () => {
    const result = parseBody({ name: 'a'.repeat(200) }, ['name'])
    expect(result.ok).toBe(true)
  })
})
