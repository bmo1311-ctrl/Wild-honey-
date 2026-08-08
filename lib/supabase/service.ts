import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Service-role client — bypasses Row Level Security entirely.
 * NEVER import this into anything that runs in the browser or that a user
 * request can reach directly. Only used by the Stripe webhook, which is
 * only ever called by Stripe's servers.
 */
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}
