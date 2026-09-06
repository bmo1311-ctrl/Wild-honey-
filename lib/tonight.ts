/**
 * What tonight is.
 *
 * A routine tells you what you own. This tells you what to do this evening,
 * which is the thing people actually get wrong — retinol two nights running,
 * an acid on top of it, then three weeks of a wrecked barrier.
 *
 * The rule is simple and it comes from how actives work rather than from
 * anyone's preference: strong things need recovery between them, only one
 * strong thing a night, and the nights in between are for repair, not for
 * finding something else strong to do.
 */

import { getActive } from '@/lib/actives'
import { ritualFor, type Ritual } from '@/lib/rituals'
import type { ShelfItem } from '@/lib/routine'

/**
 * Most strong nights allowed in any rolling seven.
 *
 * Without this, a shelf with four actives has something "due" every single
 * night and the barrier never recovers — which is the exact over-treatment
 * this feature exists to prevent. Three nights off a week is the floor.
 */
const MAX_STRONG_NIGHTS_PER_WEEK = 4

/** Minimum nights between uses, by active. Longer for the harsher ones. */
const MIN_GAP_NIGHTS: Record<string, number> = {
  retinoid: 2,
  aha: 6,
  bha: 3,
  'benzoyl-peroxide': 2,
  hydroquinone: 1,
}

/** Everything that has to earn its night. Anything else is safe daily. */
export function isStrong(activeKey: string): boolean {
  return activeKey in MIN_GAP_NIGHTS
}

export interface LogEntry {
  memberProductId: string | null
  ritualSlug: string | null
  date: string
}

export interface Tonight {
  kind: 'treatment' | 'nourish'
  /** The one strong product for tonight, when there is one. */
  treatment?: { id: string; name: string; active: string; nightsSince: number | null }
  /** The gentle option, on the nights nothing strong is due. */
  ritual?: Ritual
  /** The everyday steps that happen regardless. */
  alongside: { id: string; name: string }[]
  /** One line explaining the decision, in her voice. */
  reason: string
  /** Strong products not chosen tonight, and when each is next due. */
  waiting: { name: string; nightsAway: number }[]
}

function nightsBetween(a: string, b: string): number {
  return Math.round((Date.parse(a) - Date.parse(b)) / 86_400_000)
}

function spell(n: number): string {
  return ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven'][n] ?? String(n)
}

/**
 * Decide tonight from the shelf and the log.
 *
 * Picks the single most overdue strong product. If nothing is due, it is a
 * nourish night — and that is stated as the plan, not as an absence.
 */
export function planTonight(input: {
  shelf: ShelfItem[]
  log: LogEntry[]
  today: string
  allergies?: string | null
}): Tonight {
  const { shelf, log, today, allergies } = input

  const lastDone = new Map<string, string>()
  for (const entry of log) {
    if (!entry.memberProductId) continue
    const seen = lastDone.get(entry.memberProductId)
    if (!seen || entry.date > seen) lastDone.set(entry.memberProductId, entry.date)
  }

  const strong = shelf
    .map((item) => {
      const active = item.actives.find(isStrong)
      if (!active) return null
      const last = lastDone.get(item.id) ?? null
      const since = last ? nightsBetween(today, last) : null
      return { item, active, since, gap: MIN_GAP_NIGHTS[active] }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)

  // Never used counts as fully due, so a new product is not held back.
  const due = strong.filter((s) => s.since === null || s.since >= s.gap)
  const notDue = strong.filter((s) => s.since !== null && s.since < s.gap)

  const alongside = shelf
    .filter((i) => !i.actives.some(isStrong) && i.category !== 'spf')
    .map((i) => ({ id: i.id, name: i.name }))

  // How hard the last week has already been on her skin.
  const strongIds = new Set(strong.map((s) => s.item.id))
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 6)
  const weekAgoStr = weekAgo.toISOString().slice(0, 10)
  const strongThisWeek = log.filter(
    (e) => e.memberProductId && strongIds.has(e.memberProductId) && e.date >= weekAgoStr && e.date <= today,
  ).length

  const waiting = notDue.map((s) => ({
    name: s.item.name,
    nightsAway: s.gap - (s.since ?? 0),
  }))

  // Earned rest beats an eligible active. A week is only so long.
  const restEarned = strongThisWeek >= MAX_STRONG_NIGHTS_PER_WEEK

  if (due.length > 0 && !restEarned) {
    // Most overdue first; a brand-new product goes ahead of a merely-due one.
    due.sort((a, b) => (b.since ?? 99) - (a.since ?? 99))
    const pick = due[0]
    const label = getActive(pick.active)?.label ?? pick.active
    const reason =
      pick.since === null
        ? `first night with ${pick.item.name.toLowerCase()}. start with a thin layer.`
        : `${spell(pick.since)} nights since your last ${label.toLowerCase()} night. tonight is the night.`

    return {
      kind: 'treatment',
      treatment: { id: pick.item.id, name: pick.item.name, active: pick.active, nightsSince: pick.since },
      alongside,
      reason,
      waiting,
    }
  }

  const soonest = waiting.slice().sort((a, b) => a.nightsAway - b.nightsAway)[0]
  const ritual = ritualFor(today, allergies)
  const reason = restEarned
    ? `${spell(strongThisWeek)} strong nights already this week. tonight your skin gets one back.`
    : soonest
      ? `nothing strong is due tonight — ${soonest.name.toLowerCase()} comes back in ${spell(soonest.nightsAway)}. tonight is for putting back what the week took.`
      : 'a gentle night. this is where the repair actually happens.'

  return {
    kind: 'nourish',
    ritual: ritual ?? undefined,
    alongside,
    reason,
    waiting,
  }
}
