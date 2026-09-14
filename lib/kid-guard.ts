import { redirect } from 'next/navigation'
import { getSessionProfile } from '@/lib/data'

/**
 * Server-side guards for the pages a child should never reach.
 *
 * `KidGate` is a `useEffect` redirect, so by the time it runs the page's
 * server component has already executed and sent its data to the browser. For
 * a page her parent deliberately switched off, that is not a redirect — it is
 * a flash of the thing itself, with the data already delivered.
 *
 * The first attempt at fixing this put the pathname in a request header from
 * `proxy.ts` so the shared layout could check it once. `proxy` runs in front
 * of every request in the app and owns the Supabase session refresh, and
 * changing it took the whole site down. So this does the opposite: no global
 * anything. Each page that should be closed to a child says so itself, in one
 * line, where it can be read and grepped.
 *
 * Both calls are effectively free. `getSessionProfile` is memoised per
 * request, and every one of these pages already loads it.
 */

/** Not for children at all. */
export async function adultsOnly(): Promise<void> {
  const me = await getSessionProfile()
  if (me?.is_child) redirect('/app')
}

/**
 * Open to a child only if her parent switched the Circle on.
 *
 * This is the one that mattered most: `child_permissions.circle` had no
 * enforcement anywhere other than which tabs were drawn, and a child inherits
 * her guardian's paid tier — so with the toggle off she could still open the
 * Circle by URL and post in it.
 */
export async function circleOrRedirect(): Promise<void> {
  const me = await getSessionProfile()
  if (me?.is_child && !me.child_permissions?.circle) redirect('/app')
}

/**
 * May this account take part in the Circle at all?
 *
 * The page guards above close the *door*. They do not close the *action* —
 * server actions are plain POSTs whose ids sit in the client bundle, and a
 * child's session is valid app-wide, so `circleOrRedirect()` on the page
 * stops her seeing the Circle and stops nothing about writing to it.
 *
 * The database does not close it either, and this is the part worth naming:
 * the INSERT policies on `community_posts`, `community_comments` and
 * `community_reactions` all require `is_paid()`, and `is_paid()` deliberately
 * returns her guardian's tier. So a paid household's child passes every check
 * the app has — RLS included — while her parent has the Circle switched off.
 *
 * Returns an error object rather than redirecting, because a server action
 * should answer the caller rather than throw a navigation at her.
 */
export async function circleWriteAllowed(): Promise<{ error: string } | null> {
  const me = await getSessionProfile()
  if (!me?.is_child) return null
  if (me.child_permissions?.circle) return null
  return { error: 'The Circle is not switched on for this account.' }
}
