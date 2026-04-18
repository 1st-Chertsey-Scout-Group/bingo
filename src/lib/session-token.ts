import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

const TOKEN_BYTES = 32

export function generateSessionToken(): string {
  return randomBytes(TOKEN_BYTES).toString('hex')
}

export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function verifySessionToken(
  token: string,
  expectedHash: string,
): boolean {
  const actualHash = hashSessionToken(token)
  if (actualHash.length !== expectedHash.length) {
    return false
  }
  const a = Buffer.from(actualHash, 'hex')
  const b = Buffer.from(expectedHash, 'hex')
  if (a.length !== b.length) {
    return false
  }
  return timingSafeEqual(a, b)
}
