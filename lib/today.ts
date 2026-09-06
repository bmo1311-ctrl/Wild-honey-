import { cookies } from 'next/headers'

/**
 * Today, in her timezone.
 *
 * The server runs in UTC, so "today" flipped at 5pm Pacific and the course
 * moved to day two while she was still eating dinner on day one. A tiny
 * client component stores her zone in a cookie; this reads it. Falls back to
 * UTC only when the cookie is missing.
 */
export async function localTimeZone(): Promise<string> {
  try {
    const tz = (await cookies()).get('tz')?.value
    if (tz && /^[A-Za-z_]+\/[A-Za-z_\/+\-0-9]+$|^UTC$/.test(tz)) return tz
  } catch {
    /* outside a request */
  }
  return 'UTC'
}

export async function localToday(): Promise<string> {
  const tz = await localTimeZone()
  // en-CA formats as YYYY-MM-DD
  return new Date().toLocaleDateString('en-CA', { timeZone: tz })
}

export async function localHour(): Promise<number> {
  const tz = await localTimeZone()
  return Number(new Date().toLocaleString('en-US', { timeZone: tz, hour: 'numeric', hour12: false }))
}
