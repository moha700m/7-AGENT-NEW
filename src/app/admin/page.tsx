import { getServerSession } from 'next-auth'
import { notFound, redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AdminAgentForm } from '@/components/admin-agent-form'
import { AdminAgentStatus } from '@/components/admin-agent-status'

export const metadata = { title: 'إدارة السوق' }
export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  if (session.user.role !== 'ADMIN') notFound()
  const agents = await prisma.agent.findMany({ include: { category: true }, orderBy: { updatedAt: 'desc' }, take: 100 })
  return <main><section><p className="eyebrow">الإدارة</p><h1>إدارة سوق الوكلاء</h1><div className="admin-layout"><AdminAgentForm /><div><h2>الوكلاء</h2>{agents.length ? <div className="admin-list">{agents.map((agent) => <article className="card admin-row" key={agent.id}><div><b>{agent.nameAr}</b><p>{agent.category.nameAr} · {agent.priceMonthly.toLocaleString('ar-SA')} ر.س</p></div><AdminAgentStatus id={agent.id} status={agent.status} /></article>)}</div> : <div className="empty-state">لا يوجد وكلاء بعد.</div>}</div></div></section></main>
}
