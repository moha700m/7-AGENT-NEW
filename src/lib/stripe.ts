import Stripe from 'stripe'

let stripeClient: Stripe | null | undefined

export function getStripe() {
  if (stripeClient !== undefined) return stripeClient
  const key = process.env.STRIPE_SECRET_KEY
  stripeClient = key ? new Stripe(key, { typescript: true }) : null
  return stripeClient
}
