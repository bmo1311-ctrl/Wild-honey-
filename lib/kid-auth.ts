import { createHmac } from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/service'

/**
 * How a child's sign-in password is derived.
 *
 * It used to be `${familyCode}-${pin}`. Both halves of that are things a child
 * is meant to say out loud — a family code gets typed in front of a classroom,
 * a PIN is four digits — and `lookupFamily` hands the member ids for any code
 * to anyone who asks, without a session. The email is
 * `<memberId>@kid.wildhoney.app`. So knowing one six-character code gave you
 * the email for every child in that family and left 10,000 guesses, made
 * straight against Supabase's auth endpoint where nothing of ours is in the
 * way.
 *
 * Now the password is an HMAC under a secret that lives in a table with RLS on
 * and no policies — service role only, unreadable even to her own admin
 * session. Knowing the code and the PIN is no longer enough; you have to come
 * through `childCredentials`, which we can count. The throttle in that action
 * is only worth anything because of this.
 *
 * The PIN itself is never stored. It goes into the HMAC and the resulting
 * password is what Supabase holds, hashed, as it would any password.
 *
 * NOTE: this changes every existing child password. There is exactly one child
 * account and it has never been signed into; her parent re-sets the PIN from
 * Settings and it is correct again.
 */

let cached: string | null = null

async function secret(): Promise<string> {
  if (cached) return cached
  const admin = createServiceClient()
  const { data } = await admin.from('kid_auth_secret').select('secret').eq('name', 'child_password_v1').maybeSingle()
  const value = (data as { secret?: string } | null)?.secret
  if (!value) {
    // Loudly, rather than falling back to something weaker. A silent fallback
    // here would recreate exactly the scheme this replaced, and nothing would
    // look wrong.
    throw new Error('kid_auth_secret is missing — child sign-in cannot be derived safely.')
  }
  cached = value
  return value
}

export function childEmail(memberId: string): string {
  return `${memberId}@kid.wildhoney.app`
}

export async function childPassword(memberId: string, familyCode: string, pin: string): Promise<string> {
  const key = await secret()
  return createHmac('sha256', key)
    .update(`${memberId}|${familyCode.trim().toUpperCase()}|${pin}`)
    .digest('hex')
}

/** Ten tries in fifteen minutes, then a fifteen-minute wait. */
const MAX_ATTEMPTS = 10
const WINDOW_MS = 15 * 60 * 1000
const LOCK_MS = 15 * 60 * 1000

/**
 * Count a request for a child's credentials, and refuse when there have been
 * too many.
 *
 * Counts *requests* rather than failures, because the sign-in itself happens
 * in the browser and a caller working through PINs would simply not report
 * back. A child asks once, or twice if she fat-fingers it. Ten in a quarter of
 * an hour is generous for her and turns 10,000 guesses into about six weeks.
 */
export async function throttleChildSignin(memberId: string): Promise<{ error: string } | null> {
  const admin = createServiceClient()
  const now = Date.now()
  const { data } = await admin
    .from('child_signin_attempts')
    .select('attempts, window_started_at, locked_until')
    .eq('member_id', memberId)
    .maybeSingle()

  const row = data as { attempts: number; window_started_at: string; locked_until: string | null } | null

  if (row?.locked_until && Date.parse(row.locked_until) > now) {
    return { error: 'Too many tries. Ask a grown-up to help, and try again in a little while.' }
  }

  const windowOpen = row ? now - Date.parse(row.window_started_at) < WINDOW_MS : false
  const attempts = windowOpen ? row!.attempts + 1 : 1
  const locked = attempts > MAX_ATTEMPTS

  await admin.from('child_signin_attempts').upsert(
    {
      member_id: memberId,
      attempts: locked ? 0 : attempts,
      window_started_at: windowOpen && !locked ? row!.window_started_at : new Date(now).toISOString(),
      locked_until: locked ? new Date(now + LOCK_MS).toISOString() : null,
    },
    { onConflict: 'member_id' },
  )

  if (locked) {
    return { error: 'Too many tries. Ask a grown-up to help, and try again in a little while.' }
  }
  return null
}

/** She got in — stop counting. */
export async function clearChildSigninAttempts(memberId: string): Promise<void> {
  const admin = createServiceClient()
  await admin.from('child_signin_attempts').delete().eq('member_id', memberId)
}
