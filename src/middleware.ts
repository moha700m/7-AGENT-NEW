import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis/cloudflare'

let distributedLimiter: Ratelimit | null | undefined
const localLimits = new Map<string, { count: number; reset: number }>()

function getDistributedLimiter() {
  if (distributedLimiter !== undefined) return distributedLimiter
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  distributedLimiter = url && token
    ? new Ratelimit({ redis: new Redis({ url, token }), limiter: Ratelimit.slidingWindow(60, '1 m'), analytics: true, prefix: 'wakeel:api' })
    : null
  return distributedLimiter
}

function localLimit(identifier: string) {
  const now = Date.now()
  const current = localLimits.get(identifier)
  if (!current || now >= current.reset) {
    if (localLimits.size > 10_000) localLimits.clear()
    localLimits.set(identifier, { count: 1, reset: now + 60_000 })
    return { success: true, remaining: 59, reset: now + 60_000 }
  }
  current.count += 1
  return { success: current.count <= 60, remaining: Math.max(0, 60 - current.count), reset: current.reset }
}

export async function middleware(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID()
  const pathname = request.nextUrl.pathname

  const unsafeMethod = !['GET', 'HEAD', 'OPTIONS'].includes(request.method)
  const sameOriginRequired = pathname === '/api/auth/register' || pathname === '/api/checkout' || pathname.startsWith('/api/admin/')
  if (unsafeMethod && sameOriginRequired) {
    const origin = request.headers.get('origin')
    if (origin && origin !== request.nextUrl.origin) {
      return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 })
    }
  }

  if (pathname.startsWith('/api/')) {
    const identifier = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip') ?? 'unknown'
    const limiter = getDistributedLimiter()
    if (!limiter && process.env.REQUIRE_DISTRIBUTED_RATE_LIMIT === 'true') {
      return NextResponse.json({ error: 'Rate limiter is not configured' }, { status: 503 })
    }
    const result = limiter ? await limiter.limit(identifier) : localLimit(identifier)
    if (!result.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.max(1, Math.ceil((result.reset - Date.now()) / 1000))) } })
    }
  }

  const protectedRoutes = ['/dashboard', '/admin', '/settings']
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.redirect(new URL('/login', request.url))
  }

  const response = NextResponse.next()
  response.headers.set('X-Request-Id', requestId)
  return response
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] }
