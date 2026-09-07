import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Square has no hosted customer portal the way Stripe does, so there is
 * nothing to redirect to. Members manage a subscription from the receipt
 * Square emails them, and Brooke can cancel or pause any subscription from
 * her Square dashboard.
 *
 * This route stays so older links do not dead-end. It redirects against the
 * incoming request's own origin rather than an environment variable — the
 * previous version fell back to localhost:3000 whenever NEXT_PUBLIC_SITE_URL
 * was unset, which is exactly what it did in production: "manage my
 * membership" sent people to a machine that was not there.
 */
export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/auth/login', origin))
  return NextResponse.redirect(new URL('/app/membership?billing=square', origin))
}
