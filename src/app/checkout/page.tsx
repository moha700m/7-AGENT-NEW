import { getServerSession } from 'next-auth'
import { notFound, redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CheckoutButton } from '@/components/checkout-button'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'إتمام الاشتراك' }

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ agent?: string }> }) {
  const { agent: agentSlug } = await searchParams
  const session = await getServerSession(authOptions)
  if (!session) redirect(`/login?callbackUrl=${encodeURIComponent(`/checkout?agent=${agentSlug ?? ''}`)}`)
  const agent = agentSlug ? await prisma.agent.findFirst({ where: { slug: agentSlug, status: 'PUBLISHED' } }) : null
  if (!agent) notFound()
  return <main><section className="checkout-panel card"><p className="eyebrow">اشتراك آمن</p><h1>{agent.nameAr}</h1><p>{agent.summary}</p><h2>{agent.priceMonthly.toLocaleString('ar-SA')} ر.س / شهر</h2><p>سيتم تحويلك إلى Stripe لإتمام الدفع بأمان.</p><CheckoutButton agentSlug={agent.slug} /></section></main>
}
