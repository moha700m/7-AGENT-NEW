import { NextRequest, NextResponse } from 'next/server'
export function proxy(request: NextRequest) { const response = NextResponse.next(); response.headers.set('X-Request-Id', crypto.randomUUID()); return response }
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] }
