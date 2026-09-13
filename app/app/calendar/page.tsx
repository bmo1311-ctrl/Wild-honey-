import { redirect } from 'next/navigation'

/**
 * The thirteen-month calendar is gone — two calendars in one app was one
 * calendar too many, and Studio is the one she plans her work in.
 *
 * This stays as a redirect rather than a deletion because the commitments
 * and experiments that lived here are still very much alive, just under
 * their own name now. Anything still pointing here — a bookmark, a
 * notification, a link in an older build — lands where it meant to.
 */
export default function CalendarPage() {
  redirect('/app/promises')
}
