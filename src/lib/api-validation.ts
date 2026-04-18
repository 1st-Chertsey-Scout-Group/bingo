import { NextResponse } from 'next/server'

import type { ErrorResponse } from '@/lib/api-types'

const MAX_STRING_LENGTH = 200

type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; response: NextResponse<ErrorResponse> }

export function parseBody<T>(
  body: unknown,
  requiredFields: string[],
): ParseResult<T> {
  if (typeof body !== 'object' || body === null) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: `${requiredFields.join(', ')} required` },
        { status: 400 },
      ),
    }
  }

  const record = body as Record<string, unknown>

  for (const field of requiredFields) {
    const value = record[field]
    if (typeof value !== 'string' || value.trim() === '') {
      return {
        ok: false,
        response: NextResponse.json(
          { error: `${field} is required` },
          { status: 400 },
        ),
      }
    }
    if (value.length > MAX_STRING_LENGTH) {
      return {
        ok: false,
        response: NextResponse.json(
          {
            error: `${field} must be ${String(MAX_STRING_LENGTH)} characters or fewer`,
          },
          { status: 400 },
        ),
      }
    }
  }

  return { ok: true, data: body as T }
}
