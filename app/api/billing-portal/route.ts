import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { stripeConfigured, getStripe } from '@/lib/stripe'

export async function GET(req: Request) {
  const origin = new URL(req.url).origin

  if (!stripeConfigured()) {
    return NextResponse.redirect(`${origin}/app/profile`)
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${origin}/auth/login`)

  const service = createServiceClient()
  const { data: membership } = await service
    .from('memberships')
    .select('stripe_subscription_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!membership?.stripe_subscription_id) {
    return NextResponse.redirect(`${origin}/app/profile`)
  }

  const stripe = getStripe()
  const subscription = await stripe.subscriptions.retrieve(membership.stripe_subscription_id)
  const customerId =
    typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${origin}/app/profile`,
  })

  return NextResponse.redirect(portalSession.url)
}
