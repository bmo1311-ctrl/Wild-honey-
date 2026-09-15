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

import { findConflicts, getActive } from '@/lib/actives'
import { getRitual, ritualFor, type Ritual } from '@/lib/rituals'
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
  /**
   * Strong products the app has no record of, and cannot safely space.
   *
   * Not a scolding and not a to-do list. It is the app admitting it does not
   * know, and the one question worth asking her — asked once per product, not
   * every night.
   */
  unsure: { id: string; name: string; active: string }[]
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
      const gap = MIN_GAP_NIGHTS[active]
      /*
       * Is "no record" the same as "never used"?
       *
       * It was. The line here read `since === null || since >= gap`, with a
       * comment saying "never used counts as fully due, so a new product is
       * not held back" — which means that with an empty log **every strong
       * active is due every single night, for ever**. `strongThisWeek` is
       * also 0, so `restEarned` never fires either. Both halves of the
       * spacing logic are switched off by the absence of logs.
       *
       * Brooke has ten products on her shelf and has never logged a routine.
       * So this card has been telling her to use her strongest acid or
       * retinoid every night since the day she set it up — and spacing those
       * is the one genuinely protective thing this engine does.
       *
       * It is rule one of CONSCIOUSNESS.md in the place where it matters
       * most: silence is not data. Not logging a retinoid is not evidence
       * she did not use one.
       *
       * So a product she has *just added* is still treated as new, because
       * that is a real fact with a date behind it. A product that has sat on
       * the shelf with no record is `unsure` — the app does not know, says so,
       * and does not recommend a strong active on the strength of not knowing.
       */
      const addedRecently =
        item.addedOn != null && nightsBetween(today, item.addedOn.slice(0, 10)) <= gap
      return { item, active, since, gap, unknown: since === null && !addedRecently }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)

  const known = strong.filter((s) => !s.unknown)
  const due = known.filter((s) => s.since === null || s.since >= s.gap)
  const notDue = known.filter((s) => s.since !== null && s.since < s.gap)
  const unsure = strong
    .filter((s) => s.unknown)
    .map((s) => ({ id: s.item.id, name: s.item.name, active: s.active }))

  /*
   * What else belongs in tonight's routine.
   *
   * Three exclusions, and only the first was here. Strong actives are handled
   * above. SPF is a morning step. And so is anything else marked `am` — which
   * is the one that was actually broken: vitamin C is neither strong nor SPF,
   * so it was being listed as an evening step, and on a benzoyl peroxide
   * night the card cheerfully proposed the exact pairing `lib/actives.ts`
   * warns about ("it breaks both down").
   *
   * Then, whatever survives that, checked against the conflict rules rather
   * than assumed compatible — `planTonight` never asked.
   */
  const companionsFor = (chosenActives: string[]) =>
    shelf
      .filter((i) => !i.actives.some(isStrong) && i.category !== 'spf')
      .filter((i) => !i.actives.some((k) => getActive(k)?.timeOfDay === 'am'))
      .filter((i) => findConflicts([...chosenActives, ...i.actives]).length === 0)
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
        : // "since the last one you told me about", not "since your last one".
          // The app knows what it was told and nothing else, and saying it
          // the other way claims knowledge of her bathroom.
          `${spell(pick.since)} nights since the last ${label.toLowerCase()} night you told me about. tonight is the night.`

    return {
      kind: 'treatment',
      treatment: { id: pick.item.id, name: pick.item.name, active: pick.active, nightsSince: pick.since },
      alongside: companionsFor(pick.item.actives),
      reason,
      waiting,
      unsure,
    }
  }

  const soonest = waiting.slice().sort((a, b) => a.nightsAway - b.nightsAway)[0]
  const ritual = ritualFor(today, allergies)
  const reason = restEarned
    ? `${spell(strongThisWeek)} strong nights already this week. tonight your skin gets one back.`
    : unsure.length > 0 && known.length === 0
      ? // Honest about why. Not "you have not logged anything" — that is her
        // absence read back at her — but what the app itself does not know.
        `a gentle night. spacing ${unsure.length === 1 ? unsure[0].name.toLowerCase() : 'your stronger things'} properly needs to know when you last used ${unsure.length === 1 ? 'it' : 'them'}, and gentle is the safe answer meanwhile.`
      : soonest
        ? `nothing strong is due tonight — ${soonest.name.toLowerCase()} comes back in ${spell(soonest.nightsAway)}. tonight is for putting back what the week took.`
        : 'a gentle night. this is where the repair actually happens.'

  return {
    kind: 'nourish',
    ritual: ritual ?? undefined,
    alongside: companionsFor([]),
    reason,
    waiting,
    unsure,
  }
}

export interface PlannedNight {
  date: string
  /** Mon, Tue… */
  weekday: string
  kind: 'treatment' | 'nourish'
  /** What it is, short enough for a calendar cell. */
  label: string
  isToday: boolean
  isPast: boolean
  done: boolean
}

/**
 * The week ahead, laid out.
 *
 * Tonight answers "what now". This answers "when is my acid night" without
 * her having to hold it in her head — which is the actual job a calendar
 * does. It runs the same decision forward, assuming she follows it, so the
 * week she sees is the week she gets.
 *
 * Past days show what actually happened; future days show the plan.
 */
export function planWeek(input: {
  shelf: ShelfItem[]
  log: LogEntry[]
  today: string
  allergies?: string | null
  /** How many days back to show. The rest of the seven runs forward. */
  lookBack?: number
}): PlannedNight[] {
  const { shelf, log, today, allergies, lookBack = 2 } = input
  const out: PlannedNight[] = []

  // Everything already recorded stays fixed; the future is simulated on top.
  const projected: LogEntry[] = log.slice()
  const start = new Date(today)
  start.setDate(start.getDate() - lookBack)

  for (let i = 0; i < 7; i += 1) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    const date = d.toISOString().slice(0, 10)
    const isPast = date < today
    const isToday = date === today

    const doneThat = log.filter((e) => e.date === date)

    if (isPast) {
      // What actually happened, not what was planned.
      const productDone = doneThat.find((e) => e.memberProductId)
      const ritualDone = doneThat.find((e) => e.ritualSlug)
      const item = productDone ? shelf.find((s) => s.id === productDone.memberProductId) : null
      out.push({
        date,
        weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
        kind: productDone ? 'treatment' : 'nourish',
        label: item?.name ?? (ritualDone ? getRitualLabel(ritualDone.ritualSlug) : '—'),
        isToday: false,
        isPast: true,
        done: doneThat.length > 0,
      })
      continue
    }

    const plan = planTonight({ shelf, log: projected, today: date, allergies })
    const label = plan.kind === 'treatment' ? plan.treatment!.name : (plan.ritual?.title ?? 'rest')

    out.push({
      date,
      weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
      kind: plan.kind,
      label,
      isToday,
      isPast: false,
      done: isToday && doneThat.length > 0,
    })

    // Assume she follows it, so tomorrow is planned against today's choice.
    if (plan.kind === 'treatment') {
      projected.push({ memberProductId: plan.treatment!.id, ritualSlug: null, date })
    } else if (plan.ritual) {
      projected.push({ memberProductId: null, ritualSlug: plan.ritual.slug, date })
    }
  }

  return out
}

function getRitualLabel(slug: string | null): string {
  if (!slug) return 'rest'
  return getRitual(slug)?.title ?? slug.replace(/-/g, ' ')
}
