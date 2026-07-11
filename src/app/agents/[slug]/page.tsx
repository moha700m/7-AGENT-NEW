import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { AgentRunner } from '@/components/agent-runner'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const agent = await prisma.agent.findFirst({ where: { slug, status: 'PUBLISHED' }, select: { nameAr: true, summary: true } })
  return agent ? { title: agent.nameAr, description: agent.summary } : { title: 'الوكيل غير موجود' }
}

export default async function AgentDetails({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const agent = await prisma.agent.findFirst({ where: { slug, status: 'PUBLISHED' }, include: { category: true } })
  if (!agent) notFound()
  const session = await getServerSession(authOptions)
  const canRun = Boolean(session && (session.user.role === 'ADMIN' || agent.ownerId === session.user.id || await prisma.subscription.count({ where: { userId: session.user.id, agentId: agent.id, status: 'ACTIVE' } }) > 0))
  return <main><SiteHeader /><section className="agent-detail"><div><p className="eyebrow">{agent.category.nameAr}</p><h1>{agent.nameAr}</h1><p className="lead">{agent.summary}</p><div className="description">{agent.description}</div>{canRun && <AgentRunner slug={agent.slug} />}</div><aside className="card purchase-card"><strong>{agent.priceMonthly.toLocaleString('ar-SA')} ر.س / شهر</strong><p>{canRun ? 'لديك صلاحية تشغيل هذا الوكيل.' : 'يشمل التحديثات والدعم الأساسي.'}</p>{!canRun && <Link className="button" href={`/checkout?agent=${agent.slug}`}>ابدأ الآن</Link>}</aside></section><SiteFooter /></main>
}
