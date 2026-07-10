import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const agents = await prisma.agent.findMany({ where: { status: 'PUBLISHED' }, select: { slug: true, updatedAt: true } })
  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/marketplace`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/pricing`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    ...agents.map((agent) => ({ url: `${baseUrl}/agents/${agent.slug}`, lastModified: agent.updatedAt, changeFrequency: 'weekly' as const, priority: 0.8 })),
  ]
}
