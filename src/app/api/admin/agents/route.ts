import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const agentSchema = z.object({
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80),
  name: z.string().trim().min(2).max(100),
  nameAr: z.string().trim().min(2).max(100),
  summary: z.string().trim().min(10).max(240),
  description: z.string().trim().min(20).max(10_000),
  priceMonthly: z.coerce.number().int().min(0).max(1_000_000),
  categorySlug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80),
  categoryName: z.string().trim().min(2).max(100),
  categoryNameAr: z.string().trim().min(2).max(100),
  publish: z.boolean().default(false),
})

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const parsed = agentSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid agent data', details: parsed.error.flatten().fieldErrors }, { status: 400 })

  const category = await prisma.category.upsert({
    where: { slug: parsed.data.categorySlug },
    update: { name: parsed.data.categoryName, nameAr: parsed.data.categoryNameAr },
    create: { slug: parsed.data.categorySlug, name: parsed.data.categoryName, nameAr: parsed.data.categoryNameAr },
  })
  const agent = await prisma.agent.create({
    data: {
      slug: parsed.data.slug, name: parsed.data.name, nameAr: parsed.data.nameAr,
      summary: parsed.data.summary, description: parsed.data.description,
      priceMonthly: parsed.data.priceMonthly, status: parsed.data.publish ? 'PUBLISHED' : 'DRAFT',
      categoryId: category.id, ownerId: session.user.id,
    },
  })
  return NextResponse.json({ agent }, { status: 201 })
}
