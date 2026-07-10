import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getStripe } from '@/lib/stripe'

const checkoutSchema = z.object({ agentSlug: z.string().trim().min(1).max(80) })

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !session.user.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const parsed = checkoutSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid checkout request' }, { status: 400 })
  const stripe = getStripe()
  if (!stripe) return NextResponse.json({ error: 'Payments are not configured' }, { status: 503 })
  const agent = await prisma.agent.findFirst({ where: { slug: parsed.data.agentSlug, status: 'PUBLISHED' } })
  if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? new URL(request.url).origin
  const checkout = await stripe.checkout.sessions.create({
    mode: 'subscription', customer_email: session.user.email,
    line_items: [{ quantity: 1, price_data: { currency: 'sar', unit_amount: agent.priceMonthly * 100, recurring: { interval: 'month' }, product_data: { name: agent.nameAr, description: agent.summary } } }],
    metadata: { userId: session.user.id, agentId: agent.id },
    success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/agents/${agent.slug}`,
  })
  if (!checkout.url) return NextResponse.json({ error: 'Checkout URL unavailable' }, { status: 502 })
  await prisma.subscription.create({ data: { userId: session.user.id, agentId: agent.id, stripeSessionId: checkout.id } })
  return NextResponse.json({ url: checkout.url })
}
