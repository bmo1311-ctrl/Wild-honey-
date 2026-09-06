/**
 * Square, over plain fetch.
 *
 * No SDK on purpose — Square's REST API is small enough that a dependency
 * would cost more than it saves, and this keeps the build light.
 *
 * Environment variables:
 *   SQUARE_ACCESS_TOKEN          the access token for the Square application
 *   SQUARE_LOCATION_ID           which location the money belongs to
 *   SQUARE_ENVIRONMENT           'production' (default) or 'sandbox'
 *   SQUARE_WEBHOOK_SIGNATURE_KEY used to verify webhooks are really from Square
 *   SQUARE_PLAN_MONTHLY          subscription plan VARIATION id for $12/month
 *   SQUARE_PLAN_ANNUAL           subscription plan VARIATION id for $99/year
 *
 * Buyers subscribe to a plan *variation*, not a plan — the id in those last
 * two must be the variation, or Square rejects the checkout.
 */

const SQUARE_VERSION = '2026-08-19'

export function squareConfigured(): boolean {
  return Boolean(process.env.SQUARE_ACCESS_TOKEN && process.env.SQUARE_LOCATION_ID)
}

function apiBase(): string {
  return process.env.SQUARE_ENVIRONMENT === 'sandbox'
    ? 'https://connect.squareupsandbox.com'
    : 'https://connect.squareup.com'
}

async function squareFetch<T>(path: string, init: RequestInit & { body?: string }): Promise<T> {
  const token = process.env.SQUARE_ACCESS_TOKEN
  if (!token) throw new Error('SQUARE_ACCESS_TOKEN is not set.')
  const res = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Square-Version': SQUARE_VERSION,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
  })
  const json = (await res.json()) as T & { errors?: { code: string; detail?: string }[] }
  if (!res.ok || json.errors?.length) {
    const detail = json.errors?.map((e) => e.detail ?? e.code).join('; ') ?? `HTTP ${res.status}`
    throw new Error(`Square: ${detail}`)
  }
  return json
}

export interface PaymentLink {
  id: string
  url: string
  long_url?: string
  order_id?: string
}

/**
 * A Square-hosted checkout page.
 *
 * Pass planVariationId to make it a recurring subscription — Square stores the
 * card and charges it on the plan's cadence. Leave it off for a one-off, like
 * a call or a digital product.
 *
 * `note` rides along on the resulting payment so the webhook can tell which
 * member and which purchase this was, the way Stripe metadata did.
 */
export async function createPaymentLink(input: {
  name: string
  amountCents: number
  redirectUrl?: string
  buyerEmail?: string
  planVariationId?: string
  note?: string
  idempotencyKey: string
}): Promise<PaymentLink> {
  const body: Record<string, unknown> = {
    idempotency_key: input.idempotencyKey,
    quick_pay: {
      name: input.name,
      price_money: { amount: input.amountCents, currency: 'USD' },
      location_id: process.env.SQUARE_LOCATION_ID,
    },
    checkout_options: {
      ask_for_shipping_address: false,
      ...(input.redirectUrl ? { redirect_url: input.redirectUrl } : {}),
      ...(input.planVariationId ? { subscription_plan_id: input.planVariationId } : {}),
    },
    ...(input.buyerEmail ? { pre_populated_data: { buyer_email: input.buyerEmail } } : {}),
    ...(input.note ? { payment_note: input.note.slice(0, 500) } : {}),
  }

  const res = await squareFetch<{ payment_link: PaymentLink }>('/v2/online-checkout/payment-links', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return res.payment_link
}

/** The plan variation behind each tier, or undefined when it has not been set up yet. */
export function planVariationFor(billing: 'monthly' | 'annual'): string | undefined {
  return billing === 'annual' ? process.env.SQUARE_PLAN_ANNUAL : process.env.SQUARE_PLAN_MONTHLY
}

/**
 * Square signs webhooks with HMAC-SHA256 over (notification URL + raw body).
 * Verified with a timing-safe compare so a wrong signature cannot be guessed
 * byte by byte.
 */
export async function verifyWebhookSignature(input: {
  rawBody: string
  signature: string | null
  notificationUrl: string
}): Promise<boolean> {
  const key = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY
  if (!key || !input.signature) return false

  const { createHmac, timingSafeEqual } = await import('node:crypto')
  const expected = createHmac('sha256', key).update(input.notificationUrl + input.rawBody).digest('base64')

  const a = Buffer.from(expected)
  const b = Buffer.from(input.signature)
  return a.length === b.length && timingSafeEqual(a, b)
}
