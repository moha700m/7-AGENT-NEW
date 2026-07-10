import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const agent = await prisma.agent.findFirst({ where: { slug: params.slug, status: 'PUBLISHED' }, select: { nameAr: true, summary: true } })
  return agent ? { title: agent.nameAr, description: agent.summary } : { title: 'الوكيل غير موجود' }
}

export default async function AgentDetails({ params }: { params: { slug: string } }) {
  const agent = await prisma.agent.findFirst({ where: { slug: params.slug, status: 'PUBLISHED' }, include: { category: true } })
  if (!agent) notFound()
  return <main><SiteHeader /><section className="agent-detail"><div><p className="eyebrow">{agent.category.nameAr}</p><h1>{agent.nameAr}</h1><p className="lead">{agent.summary}</p><div className="description">{agent.description}</div></div><aside className="card purchase-card"><strong>{agent.priceMonthly.toLocaleString('ar-SA')} ر.س / شهر</strong><p>يشمل التحديثات والدعم الأساسي.</p><Link className="button" href={`/checkout?agent=${agent.slug}`}>ابدأ الآن</Link></aside></section><SiteFooter /></main>
}
