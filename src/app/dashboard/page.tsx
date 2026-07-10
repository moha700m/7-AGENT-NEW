import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const metadata = { title: 'لوحة التحكم' }
export const dynamic = 'force-dynamic'

export default async function Dashboard() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const [totalAgents, activeAgents, subscriptions] = await Promise.all([
    prisma.agent.count({ where: { ownerId: session.user.id } }),
    prisma.agent.count({ where: { ownerId: session.user.id, status: 'PUBLISHED' } }),
    prisma.subscription.findMany({ where: { userId: session.user.id }, include: { agent: true }, orderBy: { createdAt: 'desc' }, take: 20 }),
  ])

  return <main><section><p className="eyebrow">لوحة التحكم</p><h1>مرحباً {session.user.name ?? ''}</h1><div className="grid">
    <article className="card"><b>كل الوكلاء</b><h2>{totalAgents}</h2></article>
    <article className="card"><b>الوكلاء النشطون</b><h2>{activeAgents}</h2></article>
    <article className="card"><b>الحالة</b><p>{totalAgents ? 'يمكنك إدارة وكلائك من هنا.' : 'اربط وكيلك الأول للبدء.'}</p></article>
  </div><h2>اشتراكاتي</h2>{subscriptions.length ? <div className="admin-list">{subscriptions.map((subscription) => <article className="card admin-row" key={subscription.id}><div><b>{subscription.agent.nameAr}</b><p>{subscription.status === 'ACTIVE' ? 'نشط' : subscription.status === 'PENDING' ? 'بانتظار التأكيد' : subscription.status === 'PAST_DUE' ? 'الدفع متأخر' : 'ملغي'}</p></div><strong>{subscription.agent.priceMonthly.toLocaleString('ar-SA')} ر.س</strong></article>)}</div> : <div className="empty-state"><p>لا توجد اشتراكات حتى الآن.</p></div>}</section></main>
}
