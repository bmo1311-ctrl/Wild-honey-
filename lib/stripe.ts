/**
 * Stripe is wired but intentionally optional until keys are added.
 *
 * To enable payments, set these environment variables in the project:
 *   - STRIPE_SECRET_KEY                  (sk_...)
 *   - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY  (pk_...)   [not currently used server-side, kept for future client-side Stripe.js]
 *   - STRIPE_WEBHOOK_SECRET               (whsec_...)  used by app/api/webhooks/stripe
 *   - STRIPE_PRICE_CIRCLE                 (price_...)  recurring price for the Circle tier
 *   - STRIPE_PRICE_INNER_CIRCLE           (price_...)  recurring price for the Inner Circle tier
 *   - SUPABASE_SERVICE_ROLE_KEY                        used by the webhook to write purchases/memberships
 *
 * In Stripe's dashboard, point a webhook at:
 *   https://YOUR-DOMAIN/api/webhooks/stripe
 * listening for: checkout.session.completed, customer.subscription.updated,
 * customer.subscription.deleted
 */

import Stripe from 'stripe'

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY)
}

let cached: Stripe | null = null

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set — add it before calling getStripe().')
  }
  if (!cached) {
    cached = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-02-24.acacia',
    })
  }
  return cached
}

