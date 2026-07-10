import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateServerEnv } from '@/lib/env'

export const dynamic = 'force-dynamic'

export async function GET() {
  const environment = validateServerEnv()
  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({ status: environment.success ? 'ok' : 'degraded', database: 'ok', environment: environment.success ? 'ok' : 'invalid', timestamp: new Date().toISOString() }, { status: environment.success ? 200 : 503, headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json({ status: 'error', database: 'unavailable', environment: environment.success ? 'ok' : 'invalid', timestamp: new Date().toISOString() }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}
