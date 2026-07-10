import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const updateSchema = z.object({ status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']) })

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: session ? 403 : 401 })
  const parsed = updateSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  const agent = await prisma.agent.update({ where: { id: params.id }, data: { status: parsed.data.status } })
  return NextResponse.json({ agent })
}
