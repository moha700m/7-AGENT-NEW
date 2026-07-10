import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public code: string = 'UNKNOWN_ERROR'
  ) {
    super(message)
  }
}

export function validateRequest<T>(
  data: unknown,
  schema: z.ZodSchema<T>
): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw new ApiError(400, 'Validation failed', 'VALIDATION_ERROR')
  }
  return result.data
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.status }
    )
  }

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: 'Validation failed', details: error.errors },
      { status: 400 }
    )
  }

  console.error('Unhandled API error:', error)
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  )
}

export function setSecurityHeaders(response: NextResponse) {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  return response
}
