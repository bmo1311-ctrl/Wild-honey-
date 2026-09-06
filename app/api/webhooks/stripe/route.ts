import { NextResponse } from 'next/server'

/**
 * Retired. Payments moved to Square — see app/api/webhooks/square/route.ts.
 *
 * Kept as a stub rather than deleted so any webhook still pointed here gets a
 * clear answer instead of a 404, and so the old path is obviously dead to
 * anyone reading the codebase.
 */
export async function POST() {
  return NextResponse.json({ error: 'Stripe is no longer used. Payments run through Square.' }, { status: 410 })
}
