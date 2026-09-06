import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { squareConfigured, createPaymentLink, planVariationFor } from '@/lib/square'

/**
 * One route for every kind of payment, all of them Square-hosted links.
 *
 * The buyer leaves for Square's own checkout page, pays there, and comes back.
 * Card details never touch this app, which is both safer and far less to build.
 */
export async function POST(req: Request) {
  if (!squareConfigured()) {
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
  const { kind, productId, retreatId, billing } = body as {
    kind: 'product' | 'retreat' | 'membership' | 'call'
    productId?: string
    retreatId?: string
    billing?: 'monthly' | 'annual'
  }

  const origin = req.headers.get('origin') ?? process.env.NEXT_PUBLIC_SITE_URL ?? ''

  try {
    if (kind === 'membership') {
      const cycle = billing === 'annual' ? 'annual' : 'monthly'
      const planVariationId = planVariationFor(cycle)
      if (!planVariationId) {
        return NextResponse.json(
          { error: 'Membership pricing is not set up yet. Add SQUARE_PLAN_MONTHLY / SQUARE_PLAN_ANNUAL.' },
          { status: 400 },
        )
      }
      const link = await createPaymentLink({
        name: cycle === 'annual' ? 'Wild Honey Circle — yearly' : 'Wild Honey Circle — monthly',
        amountCents: Number(cycle === 'annual' ? process.env.SQUARE_PRICE_ANNUAL : process.env.SQUARE_PRICE_MONTHLY) || (cycle === 'annual' ? 29000 : 2900),
        planVariationId,
        buyerEmail: user.email ?? undefined,
        redirectUrl: `${origin}/app/profile?upgraded=1`,
        note: `membership:${cycle}:${user.id}`,
        idempotencyKey: `member-${user.id}-${cycle}-${Date.now()}`,
      })
      return NextResponse.json({ url: link.url })
    }

    if (kind === 'call') {
      const link = await createPaymentLink({
        name: '1:1 call with Brooke — 90 minutes',
        amountCents: Number(process.env.SQUARE_PRICE_CALL) || 19800,
        buyerEmail: user.email ?? undefined,
        redirectUrl: `${origin}/app/profile?call=booked`,
        note: `call:${user.id}`,
        idempotencyKey: `call-${user.id}-${Date.now()}`,
      })
      return NextResponse.json({ url: link.url })
    }

    if (kind === 'product') {
      const { data: product } = await supabase.from('products').select('*').eq('id', productId).single()
      if (!product) return NextResponse.json({ error: 'Product not found.' }, { status: 404 })
      const link = await createPaymentLink({
        name: product.title,
        amountCents: product.price_cents,
        buyerEmail: user.email ?? undefined,
        redirectUrl: `${origin}/app/shop?purchased=1`,
        note: `product:${product.id}:${user.id}`,
        idempotencyKey: `product-${user.id}-${product.id}-${Date.now()}`,
      })
      return NextResponse.json({ url: link.url })
    }

    if (kind === 'retreat') {
      const { data: retreat } = await supabase.from('retreats').select('*').eq('id', retreatId).single()
      if (!retreat) return NextResponse.json({ error: 'Retreat not found.' }, { status: 404 })
      const link = await createPaymentLink({
        name: retreat.title,
        amountCents: retreat.price_cents,
        buyerEmail: user.email ?? undefined,
        redirectUrl: `${origin}/app/retreats?joined=1`,
        note: `retreat:${retreat.id}:${user.id}`,
        idempotencyKey: `retreat-${user.id}-${retreat.id}-${Date.now()}`,
      })
      return NextResponse.json({ url: link.url })
    }

    return NextResponse.json({ error: 'Unknown checkout kind.' }, { status: 400 })
  } catch (err) {
    console.error('[checkout]', err)
    return NextResponse.json({ error: 'Could not start checkout.' }, { status: 500 })
  }
}
