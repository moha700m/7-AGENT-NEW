import Link from 'next/link'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

export const metadata = { title: 'سوق الوكلاء', description: 'تصفح وكلاء الذكاء الاصطناعي حسب المهمة والتصنيف.' }
export const dynamic = 'force-dynamic'

export default async function Marketplace({ searchParams }: { searchParams: { q?: string; category?: string } }) {
  const q = searchParams.q?.trim().slice(0, 100) ?? ''
  const category = searchParams.category?.trim().slice(0, 60) ?? ''
  const where: Prisma.AgentWhereInput = { status: 'PUBLISHED' }
  if (q) where.OR = [{ name: { contains: q, mode: 'insensitive' } }, { nameAr: { contains: q, mode: 'insensitive' } }, { summary: { contains: q, mode: 'insensitive' } }]
  if (category) where.category = { slug: category }
  const [agents, categories] = await Promise.all([
    prisma.agent.findMany({ where, include: { category: true }, orderBy: { createdAt: 'desc' }, take: 50 }),
    prisma.category.findMany({ orderBy: { nameAr: 'asc' } }),
  ])

  return <main><SiteHeader /><section><p className="eyebrow">السوق</p><h1>وكلاء أذكياء جاهزون للنمو</h1>
    <form className="filters" action="/marketplace"><input name="q" defaultValue={q} aria-label="ابحث عن وكيل" placeholder="ابحث عن وكيل أو مهمة..." /><select name="category" defaultValue={category} aria-label="التصنيف"><option value="">كل التصنيفات</option>{categories.map((item) => <option value={item.slug} key={item.id}>{item.nameAr}</option>)}</select><button className="button" type="submit">بحث</button></form>
    {agents.length ? <div className="grid">{agents.map((agent) => <article className="card" key={agent.id}><span>{agent.category.nameAr}</span><h2>{agent.nameAr}</h2><p>{agent.summary}</p><strong>{agent.priceMonthly.toLocaleString('ar-SA')} ر.س / شهر</strong><br /><Link className="button" href={`/agents/${agent.slug}`}>التفاصيل</Link></article>)}</div> : <div className="empty-state"><h2>لا توجد نتائج</h2><p>جرّب كلمة بحث أو تصنيفاً مختلفاً.</p><Link href="/marketplace">مسح عوامل البحث</Link></div>}
  </section><SiteFooter /></main>
}
