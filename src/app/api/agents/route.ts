import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { handleApiError, setSecurityHeaders } from '@/lib/api-utils'

const querySchema = z.object({
  q: z.string().trim().max(100).optional(),
  category: z.string().trim().max(60).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
})

export async function GET(request: NextRequest) {
  try {
    const query = Object.fromEntries(request.nextUrl.searchParams)
    const params = querySchema.parse(query)

    const where: any = { status: 'PUBLISHED' }
    
    if (params.q) {
      where.OR = [
        { name: { contains: params.q, mode: 'insensitive' } },
        { nameAr: { contains: params.q, mode: 'insensitive' } },
        { description: { contains: params.q, mode: 'insensitive' } },
      ]
    }

    if (params.category) {
      where.category = { slug: params.category }
    }

    const skip = (params.page - 1) * params.limit

    const [agents, total] = await Promise.all([
      prisma.agent.findMany({
        where,
        skip,
        take: params.limit,
        include: { category: true },
      }),
      prisma.agent.count({ where }),
    ])

    const response = NextResponse.json({
      data: agents,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        pages: Math.ceil(total / params.limit),
      },
    })

    return setSecurityHeaders(response)
  } catch (error) {
    return handleApiError(error)
  }
}
