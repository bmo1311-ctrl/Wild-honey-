import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Square has no hosted customer portal the way Stripe does, so there is
 * nothing to redirect to. Members manage a subscription from the receipt
 * Square emails them, and Brooke can cancel or pause any subscription from
 * her Square dashboard.
 *
 * This route stays so the existing links do not 404 — it sends people to
 * the membership page with an explanation instead.
 */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(new URL('/auth/login', process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'))
  }
  return NextResponse.redirect(
    new URL('/app/membership?billing=square', process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  )
}
