import { NextResponse } from 'next/server'

import type { ErrorResponse } from '@/lib/api-types'

export function checkAdminPin(headers: Headers): boolean {
  const pin = headers.get('x-admin-pin')
  const expected = process.env.ADMIN_PIN

  if (!expected || !pin) {
    return false
  }

  return pin === expected
}

export function unauthorizedResponse(): NextResponse<ErrorResponse> {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

export function badRequest(message: string): NextResponse<ErrorResponse> {
  return NextResponse.json({ error: message }, { status: 400 })
}

export function notFound(message: string): NextResponse<ErrorResponse> {
  return NextResponse.json({ error: message }, { status: 404 })
}

export function conflict(message: string): NextResponse<ErrorResponse> {
  return NextResponse.json({ error: message }, { status: 409 })
}
