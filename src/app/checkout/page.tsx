import { getServerSession } from 'next-auth'
import { notFound, redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CheckoutButton } from '@/components/checkout-button'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'إتمام الاشتراك' }

export default async function CheckoutPage({ searchParams }: { searchParams: { agent?: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect(`/login?callbackUrl=${encodeURIComponent(`/checkout?agent=${searchParams.agent ?? ''}`)}`)
  const agent = searchParams.agent ? await prisma.agent.findFirst({ where: { slug: searchParams.agent, status: 'PUBLISHED' } }) : null
  if (!agent) notFound()
  return <main><section className="checkout-panel card"><p className="eyebrow">اشتراك آمن</p><h1>{agent.nameAr}</h1><p>{agent.summary}</p><h2>{agent.priceMonthly.toLocaleString('ar-SA')} ر.س / شهر</h2><p>سيتم تحويلك إلى Stripe لإتمام الدفع بأمان.</p><CheckoutButton agentSlug={agent.slug} /></section></main>
}
