import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { findMany, count } = vi.hoisted(() => ({
  findMany: vi.fn(),
  count: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: { agent: { findMany, count } },
}))

import { GET } from './route'

describe('GET /api/agents', () => {
  beforeEach(() => {
    findMany.mockReset().mockResolvedValue([])
    count.mockReset().mockResolvedValue(0)
  })

  it('returns a paginated agent list', async () => {
    const response = await GET(new NextRequest('http://localhost/api/agents'))
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      data: [],
      pagination: { page: 1, limit: 10, total: 0, pages: 0 },
    })
  })

  it('passes validated search filters to Prisma', async () => {
    await GET(new NextRequest('http://localhost/api/agents?q=whatsapp&category=sales'))
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        OR: expect.any(Array),
        category: { slug: 'sales' },
      }),
    }))
  })

  it('rejects invalid pagination parameters', async () => {
    const response = await GET(new NextRequest('http://localhost/api/agents?page=abc'))
    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({ error: 'Validation failed' })
    expect(findMany).not.toHaveBeenCalled()
  })
})
