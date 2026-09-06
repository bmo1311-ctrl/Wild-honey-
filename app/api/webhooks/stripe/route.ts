import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { stripeConfigured, getStripe } from '@/lib/stripe'
import type Stripe from 'stripe'

// Which tier each recurring price buys, so a plan change in the billing
// portal lands on the profile without a second checkout.
const TIER_BY_PRICE: Record<string, string> = {
  ...(process.env.STRIPE_PRICE_CIRCLE ? { [process.env.STRIPE_PRICE_CIRCLE]: 'circle' } : {}),
  ...(process.env.STRIPE_PRICE_INNER_CIRCLE ? { [process.env.STRIPE_PRICE_INNER_CIRCLE]: 'inner-circle' } : {}),
}

// Stripe needs the raw body to verify the webhook signature, so this route
// must not be parsed as JSON by Next.js. App Router route handlers get the
// raw body via req.text() by default, so no extra config is needed here.

export async function POST(req: Request) {
  if (!stripeConfigured()) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 400 })
  }

  const stripe = getStripe()
  const signature = req.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 })
  }

  const rawBody = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err) {
    console.error('[stripe webhook] signature verification failed', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Uses the service role key so it can write regardless of RLS —
  // this route is never reachable from the browser, only from Stripe's servers.
  const supabase = createServiceClient()

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const metadata = session.metadata ?? {}
    const userId = metadata.userId

    if (!userId) {
      return NextResponse.json({ received: true })
    }

    if (metadata.kind === 'product' && metadata.productId) {
      await supabase.from('purchases').upsert(
        {
          user_id: userId,
          product_id: metadata.productId,
          stripe_payment_id: typeof session.payment_intent === 'string' ? session.payment_intent : null,
        },
        { onConflict: 'user_id,product_id' },
      )
    }

    if (metadata.kind === 'retreat' && metadata.retreatId) {
      await supabase.from('retreat_signups').upsert(
        { retreat_id: metadata.retreatId, user_id: userId, status: 'confirmed' },
        { onConflict: 'retreat_id,user_id' },
      )
      const { data: retreat } = await supabase
        .from('retreats')
        .select('spots_taken')
        .eq('id', metadata.retreatId)
        .single()
      if (retreat) {
        await supabase
          .from('retreats')
          .update({ spots_taken: retreat.spots_taken + 1 })
          .eq('id', metadata.retreatId)
      }
    }

    if (metadata.kind === 'membership' && metadata.tier) {
      await supabase.from('memberships').insert({
        user_id: userId,
        tier: metadata.tier,
        stripe_subscription_id: typeof session.subscription === 'string' ? session.subscription : null,
        status: 'active',
      })
      await supabase.from('profiles').update({ membership_tier: metadata.tier }).eq('id', userId)
    }
  }

  // Keep membership status in sync as subscriptions renew, get cancelled, or fail payment.
  if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    const { data: membership } = await supabase
      .from('memberships')
      .select('user_id')
      .eq('stripe_subscription_id', sub.id)
      .maybeSingle()

    const userId = membership?.user_id ?? sub.metadata?.userId
    if (userId) {
      // past_due keeps access while Stripe retries the card; canceled, unpaid
      // and expired close the door.
      const active = sub.status === 'active' || sub.status === 'trialing' || sub.status === 'past_due'
      const priceId = sub.items.data[0]?.price?.id
      const tier = (priceId && TIER_BY_PRICE[priceId]) || sub.metadata?.tier || null
      if (membership) {
        await supabase
          .from('memberships')
          .update({ status: sub.status, current_period_end: new Date(sub.current_period_end * 1000).toISOString(), ...(tier ? { tier } : {}) })
          .eq('stripe_subscription_id', sub.id)
      } else if (tier) {
        await supabase.from('memberships').insert({ user_id: userId, tier, stripe_subscription_id: sub.id, status: sub.status })
      }
      if (!active) {
        await supabase.from('profiles').update({ membership_tier: 'free' }).eq('id', userId)
      } else if (tier) {
        await supabase.from('profiles').update({ membership_tier: tier }).eq('id', userId)
      }
    }
  }

  return NextResponse.json({ received: true })
}
