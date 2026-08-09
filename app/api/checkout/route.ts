import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripeConfigured, getStripe } from '@/lib/stripe'

const MEMBERSHIP_PRICE_ENV: Record<string, string | undefined> = {
  circle: process.env.STRIPE_PRICE_CIRCLE,
  'inner-circle': process.env.STRIPE_PRICE_INNER_CIRCLE,
}

export async function POST(req: Request) {
  if (!stripeConfigured()) {
    return NextResponse.json({ notConfigured: true }, { status: 200 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Please log in first.' }, { status: 401 })
  }

  const body = await req.json()
  const { kind, productId, retreatId, tier } = body as {
    kind: 'product' | 'retreat' | 'membership'
    productId?: string
    retreatId?: string
    tier?: string
  }

  const stripe = getStripe()
  const origin = req.headers.get('origin') ?? process.env.NEXT_PUBLIC_SITE_URL ?? ''

  try {
    if (kind === 'product') {
      const { data: product } = await supabase.from('products').select('*').eq('id', productId).single()
      if (!product) return NextResponse.json({ error: 'Product not found.' }, { status: 404 })

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer_email: user.email ?? undefined,
        line_items: product.stripe_price_id
          ? [{ price: product.stripe_price_id, quantity: 1 }]
          : [
              {
                price_data: {
                  currency: 'usd',
                  product_data: { name: product.title },
                  unit_amount: product.price_cents,
                },
                quantity: 1,
              },
            ],
        success_url: `${origin}/app/shop?purchased=1`,
        cancel_url: `${origin}/app/shop`,
        metadata: { kind: 'product', productId: product.id, userId: user.id },
      })
      return NextResponse.json({ url: session.url })
    }

    if (kind === 'retreat') {
      const { data: retreat } = await supabase.from('retreats').select('*').eq('id', retreatId).single()
      if (!retreat) return NextResponse.json({ error: 'Retreat not found.' }, { status: 404 })

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer_email: user.email ?? undefined,
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: { name: retreat.title },
              unit_amount: retreat.price_cents,
            },
            quantity: 1,
          },
        ],
        success_url: `${origin}/app/retreats?joined=1`,
        cancel_url: `${origin}/app/retreats`,
        metadata: { kind: 'retreat', retreatId: retreat.id, userId: user.id },
      })
      return NextResponse.json({ url: session.url })
    }

    if (kind === 'membership') {
      const priceId = tier ? MEMBERSHIP_PRICE_ENV[tier] : undefined
      if (!tier || !priceId) {
        return NextResponse.json(
          { error: 'Membership pricing isn\u2019t set up yet. Add STRIPE_PRICE_CIRCLE / STRIPE_PRICE_INNER_CIRCLE env vars.' },
          { status: 400 },
        )
      }
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer_email: user.email ?? undefined,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${origin}/app/profile?upgraded=1`,
        cancel_url: `${origin}/app/membership`,
        metadata: { kind: 'membership', tier, userId: user.id },
      })
      return NextResponse.json({ url: session.url })
    }

    return NextResponse.json({ error: 'Unknown checkout kind.' }, { status: 400 })
  } catch (err) {
    console.error('[checkout]', err)
    return NextResponse.json({ error: 'Could not start checkout.' }, { status: 500 })
  }
}
