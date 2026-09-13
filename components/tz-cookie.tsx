'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Tells the server what time it is where she is.
 *
 * Two things were wrong here, and together they meant this component has
 * never done anything at all.
 *
 * It wrote the zone URL-encoded, so `America/Phoenix` went into the cookie as
 * `America%2FPhoenix` — and the server's validation regex rejects `%`, so the
 * value was thrown away on arrival and every request fell back to UTC. A
 * forward slash is legal in a cookie value, so the encoding bought nothing
 * and cost everything. It writes the zone raw now.
 *
 * And even once the cookie was right, this runs in an effect — after the
 * server has already rendered the page. So the very first load a member ever
 * makes was always going to be rendered in UTC, with no second chance,
 * because nothing told it to render again. It refreshes once when the value
 * actually changes, which fixes first load without re-fetching on every
 * subsequent one.
 */
export function TzCookie() {
  const router = useRouter()

  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      if (!tz) return

      const current = document.cookie
        .split('; ')
        .find((c) => c.startsWith('tz='))
        ?.slice(3)

      // Already correct — leave the page alone.
      if (current === tz) return

      document.cookie = `tz=${tz}; path=/; max-age=31536000; samesite=lax`

      // The server rendered this page before the cookie existed, or with a
      // stale one. Ask for it again now that it can get the hour right.
      router.refresh()
    } catch {
      /* ignore */
    }
  }, [router])

  return null
}
