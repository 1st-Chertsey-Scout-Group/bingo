import { NextResponse } from 'next/server'

export function checkAdminPin(headers: Headers): boolean {
  const pin = headers.get('x-admin-pin')
  const expected = process.env.ADMIN_PIN

  if (!expected || !pin) {
    return false
  }

  return pin === expected
}

export function unauthorizedResponse(): NextResponse {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
