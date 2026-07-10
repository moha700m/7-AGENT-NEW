import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const metadata = { title: 'لوحة التحكم' }
export const dynamic = 'force-dynamic'

export default async function Dashboard() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const [totalAgents, activeAgents] = await Promise.all([
    prisma.agent.count({ where: { ownerId: session.user.id } }),
    prisma.agent.count({ where: { ownerId: session.user.id, status: 'PUBLISHED' } }),
  ])

  return <main><section><p className="eyebrow">لوحة التحكم</p><h1>مرحباً {session.user.name ?? ''}</h1><div className="grid">
    <article className="card"><b>كل الوكلاء</b><h2>{totalAgents}</h2></article>
    <article className="card"><b>الوكلاء النشطون</b><h2>{activeAgents}</h2></article>
    <article className="card"><b>الحالة</b><p>{totalAgents ? 'يمكنك إدارة وكلائك من هنا.' : 'اربط وكيلك الأول للبدء.'}</p></article>
  </div></section></main>
}
