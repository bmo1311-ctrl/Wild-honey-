/**
 * Square payment links, created by hand in the Square dashboard.
 *
 * These are the fallback for when the Square API is not configured. They are
 * public URLs — the same ones you would paste into Instagram — so there is
 * nothing secret here and they are safe to keep in the repo.
 *
 * The tradeoff: a fixed link is the same for everyone, so a payment arriving
 * through one cannot be matched to an account automatically. Brooke sets the
 * member's tier in the admin screen after Square emails her. That is fine at
 * small numbers and stops being fine somewhere past a few dozen members —
 * at which point the API path in lib/square.ts takes over on its own, because
 * checkout prefers it whenever the keys are present.
 */

export const SQUARE_LINKS: Partial<Record<'monthly' | 'annual' | 'call', string>> = {
  monthly: 'https://square.link/u/TqtOFtVs',
  // Add the yearly and call links here once they exist in Square.
  annual: undefined,
  call: undefined,
}

export function fallbackLinkFor(kind: string, billing?: string): string | undefined {
  if (kind === 'membership') return SQUARE_LINKS[billing === 'annual' ? 'annual' : 'monthly']
  if (kind === 'call') return SQUARE_LINKS.call
  return undefined
}
