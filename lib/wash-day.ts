/**
 * What this wash is for.
 *
 * Skin runs on nights. Hair runs on washes — someone who washes twice a week
 * and someone who washes daily can use the same mask at the same "every third
 * wash" and be doing completely different things to their calendar. So the
 * unit here is the wash, not the day, and the schedule counts washes.
 *
 * The one rule underneath all of it: protein and moisture alternate. Protein
 * without moisture is how hair goes stiff, then brittle, then short. Most
 * people who say a product "ruined" their hair did protein twice in a row.
 */

import { STRUCTURAL, detectHairRole, type HairRole } from '@/lib/hair'
import type { ShelfItem } from '@/lib/routine'

export interface WashLogEntry {
  memberProductId: string | null
  date: string
}

export interface WashStep {
  id: string
  name: string
  role: HairRole
  /** One line on why it is in this wash. */
  why: string
}

export interface WashPlan {
  date: string
  /** True when today is a wash day by her own rhythm. */
  isWashDay: boolean
  /** Null when she has never logged a wash. */
  daysSinceWash: number | null
  /** Her rhythm, inferred from what she actually does. */
  cadenceDays: number
  /** Days until the next wash, when today is not one. */
  nextWashIn: number
  /** The wash, in order. */
  steps: WashStep[]
  /** What the in-between days are for. */
  between: WashStep[]
  /** The sentence that explains the call. */
  reason: string
}

const DEFAULT_CADENCE = 3
const MIN_CADENCE = 1
const MAX_CADENCE = 7

function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(a) - Date.parse(b)) / 86_400_000)
}

function spell(n: number): string {
  return ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven'][n] ?? String(n)
}

/**
 * Her wash rhythm, learned rather than asked.
 *
 * A settings field would be one more thing to fill in before the app is any
 * use. The log already knows: the typical gap between washes is the rhythm.
 * Median rather than mean, so one holiday does not move it.
 */
export function inferCadence(washDates: string[]): number {
  if (washDates.length < 3) return DEFAULT_CADENCE
  const sorted = [...new Set(washDates)].sort().reverse().slice(0, 8)
  const gaps: number[] = []
  for (let i = 0; i < sorted.length - 1; i += 1) {
    const g = daysBetween(sorted[i], sorted[i + 1])
    if (g > 0 && g <= 14) gaps.push(g)
  }
  if (gaps.length === 0) return DEFAULT_CADENCE
  gaps.sort((a, b) => a - b)
  const median = gaps[Math.floor(gaps.length / 2)]
  return Math.min(MAX_CADENCE, Math.max(MIN_CADENCE, median))
}

/** Roles that mean "this was a wash", as opposed to an oiling day. */
const WASH_ROLES: HairRole[] = ['cleanse', 'clarify']

interface Scored {
  item: ShelfItem
  role: HairRole
  /** Washes since this product was last used. Null means never. */
  washesSince: number | null
}

/**
 * Plan the wash.
 *
 * Picks at most one structural treatment — protein or bond, never both — and
 * fills the rest with the everyday steps. When nothing structural is due, the
 * wash is a moisture wash, and that is stated as the plan rather than as an
 * absence.
 */
export function planWash(input: {
  shelf: ShelfItem[]
  log: WashLogEntry[]
  today: string
}): WashPlan {
  const { shelf, log, today } = input

  const roleOf = new Map<string, HairRole>()
  for (const item of shelf) roleOf.set(item.id, detectHairRole(item.name, item.category))

  // Which past days were washes, newest first.
  const washDates = [
    ...new Set(
      log
        .filter((e) => e.memberProductId && WASH_ROLES.includes(roleOf.get(e.memberProductId) ?? 'condition'))
        .map((e) => e.date),
    ),
  ]
    .sort()
    .reverse()

  const cadenceDays = inferCadence(washDates)
  const lastWash = washDates[0] ?? null
  const daysSinceWash = lastWash ? daysBetween(today, lastWash) : null
  const washedToday = lastWash === today
  const isWashDay = washedToday || daysSinceWash === null || daysSinceWash >= cadenceDays
  const nextWashIn = isWashDay ? 0 : cadenceDays - (daysSinceWash ?? 0)

  // How many washes ago each product was last used.
  const lastUsed = new Map<string, string>()
  for (const e of log) {
    if (!e.memberProductId) continue
    const seen = lastUsed.get(e.memberProductId)
    if (!seen || e.date > seen) lastUsed.set(e.memberProductId, e.date)
  }
  const washIndex = (date: string): number => {
    const i = washDates.findIndex((d) => d <= date)
    return i === -1 ? washDates.length : i
  }

  const scored: Scored[] = shelf.map((item) => {
    const last = lastUsed.get(item.id)
    return {
      item,
      role: roleOf.get(item.id) ?? 'condition',
      washesSince: last ? washIndex(last) + (washedToday ? 0 : 1) : null,
    }
  })

  /**
   * Washes since anything of this role was used.
   *
   * The gap belongs to the role, not the bottle. Owning two bond builders is
   * not permission to do a bond treatment every wash — the hair cannot tell
   * them apart, and alternating brands is still bonding twice in a row.
   */
  const washesSinceRole = (role: HairRole): number | null => {
    const used = scored.filter((s) => s.role === role && s.washesSince !== null)
    if (used.length === 0) return null
    return Math.min(...used.map((s) => s.washesSince as number))
  }

  const pick = (role: HairRole, gap?: number): Scored | undefined => {
    const of = scored.filter((s) => s.role === role)
    if (of.length === 0) return undefined
    if (gap !== undefined) {
      const since = washesSinceRole(role)
      if (since !== null && since < gap) return undefined
    }
    // Longest-neglected bottle first, so a rotation shares the work evenly.
    return of.sort((a, b) => (b.washesSince ?? 99) - (a.washesSince ?? 99))[0]
  }

  const between: WashStep[] = []
  const oil = pick('oil')
  if (oil) {
    between.push({
      id: oil.item.id,
      name: oil.item.name,
      role: 'oil',
      why: 'lengths and ends, not the scalp.',
    })
  }

  if (!isWashDay) {
    return {
      date: today,
      isWashDay: false,
      daysSinceWash,
      cadenceDays,
      nextWashIn,
      steps: [],
      between,
      reason:
        nextWashIn === 1
          ? 'wash tomorrow. today the oils are doing their job.'
          : `wash in ${spell(nextWashIn)} days. leaving it alone is the work.`,
    }
  }

  const steps: WashStep[] = []

  // Was the last structural treatment protein? Then this wash owes moisture.
  const lastStructural = scored
    .filter((s) => STRUCTURAL.includes(s.role) && s.washesSince !== null)
    .sort((a, b) => (a.washesSince ?? 99) - (b.washesSince ?? 99))[0]
  const owesMoisture = lastStructural?.role === 'protein' && (lastStructural.washesSince ?? 99) <= 1

  const scalp = pick('scalp', 2)
  const clarify = pick('clarify', 4)

  if (clarify) {
    steps.push({
      id: clarify.item.id,
      name: clarify.item.name,
      role: 'clarify',
      why: 'buildup reset. first, before anything you want absorbed.',
    })
  } else {
    const wash = pick('cleanse')
    if (wash) {
      steps.push({ id: wash.item.id, name: wash.item.name, role: 'cleanse', why: 'scalp first, lengths last.' })
    }
  }

  if (scalp) {
    steps.push({
      id: scalp.item.id,
      name: scalp.item.name,
      role: 'scalp',
      why: 'on the scalp only, before conditioner.',
    })
  }

  // One structural treatment, or none. Never protein and bond in the same wash.
  let structural: Scored | undefined
  if (!owesMoisture) {
    structural = pick('bond', 2) ?? pick('protein', 3)
  }

  if (structural) {
    steps.push({
      id: structural.item.id,
      name: structural.item.name,
      role: structural.role,
      why:
        structural.role === 'bond'
          ? 'rebuilds the inside. leave it the full time.'
          : 'strength, this wash only. moisture next wash.',
    })
  }

  // Moisture follows either structural treatment. Protein and bond both leave
  // the strand needing softness back; what they must not do is stack together.
  const moisture = pick('moisture')
  if (moisture) {
    steps.push({
      id: moisture.item.id,
      name: moisture.item.name,
      role: 'moisture',
      why: structural
        ? `straight after the ${structural.role === 'bond' ? 'bond builder' : 'protein'}. this is the half that keeps it soft.`
        : 'mid-lengths down.',
    })
  }

  const condition = pick('condition')
  if (condition && !moisture) {
    steps.push({ id: condition.item.id, name: condition.item.name, role: 'condition', why: 'ends up.' })
  }

  const reason = clarify
    ? 'clarifying wash. everything after this one lands better.'
    : structural?.role === 'protein'
      ? 'strength wash. next one is moisture — that order matters.'
      : structural?.role === 'bond'
        ? 'bond wash. the repair happens inside the strand.'
        : owesMoisture
          ? 'moisture wash, because the last one was protein. this is the balance.'
          : 'a moisture wash. most washes should be.'

  return { date: today, isWashDay: true, daysSinceWash, cadenceDays, nextWashIn: 0, steps, between, reason }
}

export interface PlannedWashDay {
  date: string
  weekday: string
  isWash: boolean
  /** Short enough for a calendar cell. */
  label: string
  isToday: boolean
  isPast: boolean
  done: boolean
}

/**
 * The fortnight ahead.
 *
 * Two weeks rather than one, because on a three-day rhythm a single week only
 * holds two washes — not enough to see the protein and moisture alternate,
 * which is the whole thing worth seeing.
 */
export function planWashDays(input: {
  shelf: ShelfItem[]
  log: WashLogEntry[]
  today: string
  lookBack?: number
  days?: number
}): PlannedWashDay[] {
  const { shelf, log, today, lookBack = 2, days = 14 } = input
  const out: PlannedWashDay[] = []
  const projected: WashLogEntry[] = log.slice()

  const start = new Date(today)
  start.setDate(start.getDate() - lookBack)

  for (let i = 0; i < days; i += 1) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    const date = d.toISOString().slice(0, 10)
    const isPast = date < today
    const isToday = date === today
    const doneThat = log.filter((e) => e.date === date)

    if (isPast) {
      const item = doneThat[0]?.memberProductId
        ? shelf.find((s) => s.id === doneThat[0].memberProductId)
        : null
      out.push({
        date,
        weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
        isWash: doneThat.length > 0,
        label: item?.name ?? '—',
        isToday: false,
        isPast: true,
        done: doneThat.length > 0,
      })
      continue
    }

    const plan = planWash({ shelf, log: projected, today: date })
    const headline = plan.steps.find((s) => STRUCTURAL.includes(s.role) || s.role === 'clarify')
    out.push({
      date,
      weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
      isWash: plan.isWashDay,
      label: plan.isWashDay ? (headline ? headline.name : 'wash') : 'rest',
      isToday,
      isPast: false,
      done: isToday && doneThat.length > 0,
    })

    // Assume she follows it, so the next day is planned against this one.
    if (plan.isWashDay) {
      for (const s of plan.steps) projected.push({ memberProductId: s.id, date })
    }
  }

  return out
}
