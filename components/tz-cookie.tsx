'use client'

import { useEffect } from 'react'

/** Tells the server what day it is where she is. Runs once per load, sets nothing visible. */
export function TzCookie() {
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      if (tz) document.cookie = `tz=${encodeURIComponent(tz)}; path=/; max-age=31536000; samesite=lax`
    } catch {
      /* ignore */
    }
  }, [])
  return null
}
