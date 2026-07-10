import { getServerSession } from 'next-auth'
import { notFound, redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'نتيجة الوكيل' }

export default async function RunPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  const run = await prisma.agentRun.findUnique({ where: { id: params.id }, include: { agent: true } })
  if (!run || (run.userId !== session.user.id && session.user.role !== 'ADMIN')) notFound()
  return <main><section><p className="eyebrow">نتيجة محفوظة</p><h1>{run.agent.nameAr}</h1><article className="card run-record"><b>الطلب</b><p>{run.prompt}</p><b>النتيجة</b><p>{run.output ?? (run.status === 'ERROR' ? 'تعذر إكمال الطلب.' : 'قيد المعالجة...')}</p><small>{run.model} · {run.totalTokens ?? 0} رمز</small></article></section></main>
}
