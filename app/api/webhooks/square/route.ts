import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { verifyWebhookSignature } from '@/lib/square'

/**
 * Square tells us here when money moves.
 *
 * We care about two things: a payment landing (which turns access on and
 * records purchases), and a subscription changing state (which keeps access
 * honest as cards renew, fail or get cancelled).
 *
 * The note written at checkout carries who and what, in the form
 * "kind:id:userId" — the same job Stripe metadata used to do.
 */

function parseNote(note: string | null | undefined): { kind: string; ref?: string; userId?: string } | null {
  if (!note) return null
  const parts = note.split(':')
  if (parts.length === 2) return { kind: parts[0], userId: parts[1] }
  if (parts.length >= 3) return { kind: parts[0], ref: parts[1], userId: parts[2] }
  return null
}

export async function POST(req: Request) {
  const rawBody = await req.text()

  // Square signs over the exact notification URL it was configured with, so
  // this must match what is registered in the Square dashboard.
  const notificationUrl =
    process.env.SQUARE_WEBHOOK_URL ?? `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/api/webhooks/square`

  const valid = await verifyWebhookSignature({
    rawBody,
    signature: req.headers.get('x-square-hmacsha256-signature'),
    notificationUrl,
  })
  if (!valid) {
    console.error('[square webhook] signature verification failed')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const event = JSON.parse(rawBody) as {
    type?: string
    data?: { object?: Record<string, any> }
  }

  // Service role: this route is only ever reached by Square's servers, never
  // by a browser, so it writes past RLS.
  const supabase = createServiceClient()
  const type = event.type ?? ''
  const object = event.data?.object ?? {}

  // ---- a payment completed ----
  if (type === 'payment.created' || type === 'payment.updated') {
    const payment = object.payment ?? {}
    if (payment.status !== 'COMPLETED') return NextResponse.json({ received: true })

    const meta = parseNote(payment.note)
    if (!meta?.userId) return NextResponse.json({ received: true })

    if (meta.kind === 'membership') {
      const tier = 'circle'
      await supabase.from('memberships').upsert(
        {
          user_id: meta.userId,
          tier,
          stripe_subscription_id: payment.id ?? null,
          status: 'active',
        },
        { onConflict: 'user_id' },
      )
      await supabase.from('profiles').update({ membership_tier: tier }).eq('id', meta.userId)
    }

    if (meta.kind === 'product' && meta.ref) {
      await supabase.from('purchases').upsert(
        { user_id: meta.userId, product_id: meta.ref, stripe_payment_id: payment.id ?? null },
        { onConflict: 'user_id,product_id' },
      )
    }

    if (meta.kind === 'retreat' && meta.ref) {
      await supabase
        .from('retreat_signups')
        .upsert({ retreat_id: meta.ref, user_id: meta.userId, status: 'confirmed' }, { onConflict: 'retreat_id,user_id' })
      const { data: retreat } = await supabase.from('retreats').select('spots_taken').eq('id', meta.ref).single()
      if (retreat) {
        await supabase.from('retreats').update({ spots_taken: retreat.spots_taken + 1 }).eq('id', meta.ref)
      }
    }
  }

  // ---- a subscription changed ----
  if (type.startsWith('subscription.')) {
    const sub = object.subscription ?? {}
    const squareId: string | undefined = sub.id
    if (!squareId) return NextResponse.json({ received: true })

    const { data: membership } = await supabase
      .from('memberships')
      .select('user_id')
      .eq('stripe_subscription_id', squareId)
      .maybeSingle()

    const userId = membership?.user_id
    if (userId) {
      // PENDING and ACTIVE both keep the door open; DEACTIVATED and CANCELED
      // close it. PAUSED is Square's own hold, so access pauses with it.
      const status: string = sub.status ?? 'UNKNOWN'
      const active = status === 'ACTIVE' || status === 'PENDING'
      await supabase
        .from('memberships')
        .update({
          status: status.toLowerCase(),
          ...(sub.charged_through_date ? { current_period_end: new Date(sub.charged_through_date).toISOString() } : {}),
        })
        .eq('stripe_subscription_id', squareId)
      await supabase
        .from('profiles')
        .update({ membership_tier: active ? 'circle' : 'free' })
        .eq('id', userId)
    }
  }

  return NextResponse.json({ received: true })
}
