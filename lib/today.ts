import { cache } from 'react'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

/**
 * What time it is where she is.
 *
 * Three sources, in order of how much they deserve to be believed:
 *
 *   1. The zone she chose in settings. An explicit answer, and it wins.
 *   2. The `tz` cookie, written by the browser's own detection. A good guess
 *      for someone who has never been asked, and right for most people.
 *   3. UTC, which is right for almost nobody and exists only so the app does
 *      not crash before either of the other two is available.
 *
 * The old version had only steps two and three, and step two never worked.
 * The cookie was written URL-encoded — `America%2FPhoenix` — and the
 * validation regex below rejects `%`, so every request in the app's life
 * fell through to UTC. Seven hours out in Arizona, which is why Today
 * greeted her with "Evening" at noon and why the moment engine was offering
 * her the evening's skincare over lunch.
 *
 * Both ends are fixed: the cookie is written raw now, and this decodes
 * defensively in case an old encoded cookie is still sitting in her browser.
 */

/** IANA zone names, plus UTC. Anything else is not a timezone. */
const ZONE = /^[A-Za-z_]+\/[A-Za-z_/+\-0-9]+$|^UTC$/

function cleanZone(raw: string | undefined | null): string | null {
  if (!raw) return null
  // An old cookie may still be percent-encoded. Take either form.
  const value = raw.includes('%') ? safeDecode(raw) : raw
  if (!value || !ZONE.test(value)) return null
  // Final proof: ask the platform whether it can actually format with it.
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value })
    return value
  } catch {
    return null
  }
}

function safeDecode(v: string): string | null {
  try {
    return decodeURIComponent(v)
  } catch {
    return null
  }
}

/**
 * Cached for the life of one request.
 *
 * `localToday` and `localHour` get called several times while a page
 * renders, and without this each call would be its own round trip to read
 * her profile.
 */
export const localTimeZone = cache(async (): Promise<string> => {
  // 1. Her own choice.
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase.from('profiles').select('timezone').eq('id', user.id).maybeSingle()
      const chosen = cleanZone((data as { timezone?: string } | null)?.timezone)
      if (chosen) return chosen
    }
  } catch {
    /* signed out, or called outside a request */
  }

  // 2. What her browser detected.
  try {
    const detected = cleanZone((await cookies()).get('tz')?.value)
    if (detected) return detected
  } catch {
    /* outside a request */
  }

  // 3. Better than throwing.
  return 'UTC'
})

export async function localToday(): Promise<string> {
  const tz = await localTimeZone()
  // en-CA formats as YYYY-MM-DD
  return new Date().toLocaleDateString('en-CA', { timeZone: tz })
}

export async function localHour(): Promise<number> {
  const tz = await localTimeZone()
  return Number(new Date().toLocaleString('en-US', { timeZone: tz, hour: 'numeric', hour12: false }))
}
