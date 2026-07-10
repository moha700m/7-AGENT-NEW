import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
const query = z.object({ q: z.string().trim().max(100).optional(), category: z.string().trim().max(60).optional() })
export function GET(request: NextRequest) { const result = query.safeParse(Object.fromEntries(request.nextUrl.searchParams)); if (!result.success) return NextResponse.json({ error: 'Invalid search parameters' }, { status: 400 }); return NextResponse.json({ data: [], filters: result.data }, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } }) }
