import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getStripe } from '@/lib/stripe'

export async function POST(request: Request) {
  const stripe = getStripe(); const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!stripe || !webhookSecret) return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 })
  const signature = request.headers.get('stripe-signature')
  if (!signature) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  let event: Stripe.Event
  try { event = stripe.webhooks.constructEvent(await request.text(), signature, webhookSecret) }
  catch { return NextResponse.json({ error: 'Invalid signature' }, { status: 400 }) }

  if (event.type === 'checkout.session.completed') {
    const checkout = event.data.object
    await prisma.subscription.updateMany({ where: { stripeSessionId: checkout.id }, data: {
      status: 'ACTIVE',
      stripeSubscriptionId: typeof checkout.subscription === 'string' ? checkout.subscription : checkout.subscription?.id,
      stripeCustomerId: typeof checkout.customer === 'string' ? checkout.customer : checkout.customer?.id,
    } })
  }
  if (event.type === 'customer.subscription.deleted') {
    await prisma.subscription.updateMany({ where: { stripeSubscriptionId: event.data.object.id }, data: { status: 'CANCELED' } })
  }
  return NextResponse.json({ received: true })
}
