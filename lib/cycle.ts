import type { NutrientKey } from '@/lib/nutrients'

/**
 * Cycle-aware targets.
 *
 * A woman's energy needs are not the same every week, so a fixed daily target
 * is wrong for most of the month. Each phase carries a percentage shift that
 * is applied to calories and carbs.
 *
 * The defaults follow the usual finding that resting metabolic rate runs a few
 * percent higher in the luteal phase and lowest in the follicular. That is a
 * population average, not a rule — plenty of women experience it differently,
 * and every phase here can be set by hand.
 */

export type CyclePhaseKey = 'menstrual' | 'follicular' | 'ovulation' | 'luteal'

export const CYCLE_PHASES: { key: CyclePhaseKey; label: string; blurb: string }[] = [
  { key: 'menstrual', label: 'Menstrual', blurb: 'bleeding — iron matters most here' },
  { key: 'follicular', label: 'Follicular', blurb: 'rising energy, often the easiest training' },
  { key: 'ovulation', label: 'Ovulation', blurb: 'peak energy, strength usually highest' },
  { key: 'luteal', label: 'Luteal', blurb: 'metabolism runs warmer, appetite usually up' },
]

/** Percentage shift on calories and carbs, by phase. */
export const DEFAULT_ADJUSTMENTS: Record<CyclePhaseKey, number> = {
  menstrual: 2,
  follicular: -2,
  ovulation: 0,
  luteal: 7,
}

export type CycleAdjustments = Partial<Record<CyclePhaseKey, number>>

export function adjustmentFor(phase: CyclePhaseKey | null, overrides: CycleAdjustments = {}): number {
  if (!phase) return 0
  const v = overrides[phase]
  return typeof v === 'number' && Number.isFinite(v) ? v : DEFAULT_ADJUSTMENTS[phase]
}

/**
 * Calories and carbs move with the phase. Protein does not — the reason to eat
 * protein is to hold onto muscle, and that does not change week to week. Water
 * does not either.
 */
export function applyCycle(
  targets: Partial<Record<NutrientKey, number>>,
  phase: CyclePhaseKey | null,
  overrides: CycleAdjustments = {},
): { targets: Partial<Record<NutrientKey, number>>; pct: number } {
  const pct = adjustmentFor(phase, overrides)
  if (!pct) return { targets, pct: 0 }
  const factor = 1 + pct / 100
  const out = { ...targets }
  if (out.calories) out.calories = Math.round((out.calories * factor) / 10) * 10
  if (out.carbs_g) out.carbs_g = Math.round(out.carbs_g * factor)
  return { targets: out, pct }
}

/**
 * The shape of her cycle, rather than the shape of the average cycle.
 *
 * Every one of these used to be a constant in the middle of a function. A
 * five day period and ovulation on day fourteen are population averages, and
 * an app that stores "cycle length" and then quietly ignores it for everything
 * else is not personalising anything — it is asking her a question and filing
 * the answer.
 *
 * The two that matter and were missing:
 *
 * `periodLength` — she may bleed for three days or for seven. At five
 * hardcoded, a woman with a seven day period was told she was follicular
 * while she was still bleeding, and given follicular's calorie figure.
 *
 * `lutealLength` — this is the one worth getting right. The luteal phase is
 * relatively fixed for a given woman, usually 12 to 14 days; the follicular
 * phase is what stretches and shrinks and makes one cycle 24 days and the
 * next 33. So ovulation is far better counted *backwards* from the next
 * period than forwards from the last one. The old `len - 14` did do that
 * much, but with everyone's luteal phase set to 14.
 */
export interface CycleShape {
  cycleLength?: number | null
  periodLength?: number | null
  lutealLength?: number | null
  /** False means do not derive a phase from dates at all. */
  isRegular?: boolean | null
}

/** What the app assumes when she has not said. Averages, and labelled as such. */
export const CYCLE_DEFAULTS = { cycleLength: 28, periodLength: 5, lutealLength: 14 } as const

/** Her numbers where she gave them, averages where she did not, bounded either way. */
export function cycleShape(shape: CycleShape | null | undefined) {
  const clamp = (v: number | null | undefined, lo: number, hi: number, fallback: number) =>
    typeof v === 'number' && Number.isFinite(v) ? Math.min(Math.max(Math.round(v), lo), hi) : fallback
  const cycleLength = clamp(shape?.cycleLength, 15, 60, CYCLE_DEFAULTS.cycleLength)
  const lutealLength = clamp(shape?.lutealLength, 7, 20, CYCLE_DEFAULTS.lutealLength)
  return {
    cycleLength,
    // A period cannot be longer than the cycle it sits in, and cannot run past
    // ovulation. Bounded against her own numbers rather than a fixed ceiling.
    periodLength: Math.min(
      clamp(shape?.periodLength, 1, 14, CYCLE_DEFAULTS.periodLength),
      Math.max(1, cycleLength - lutealLength - 1),
    ),
    lutealLength,
    isRegular: shape?.isRegular !== false,
  }
}

/**
 * Which phase she is in, from the first day of her last period. One of the two
 * things `resolvePhase` weighs up; do not call it alone to decide what to show.
 */
export function phaseFromDates(
  lastPeriodStart: string | null,
  shape: CycleShape | number = {},
  today = new Date(),
): CyclePhaseKey | null {
  if (!lastPeriodStart) return null
  // Kept accepting a bare number so the older call sites did not all have to
  // change in one commit.
  const s = cycleShape(typeof shape === 'number' ? { cycleLength: shape } : shape)
  if (!s.isRegular) return null

  const start = Date.parse(`${lastPeriodStart.slice(0, 10)}T00:00:00Z`)
  const now = Date.parse(`${today.toISOString().slice(0, 10)}T00:00:00Z`)
  if (Number.isNaN(start) || now < start) return null
  const day = (Math.floor((now - start) / 86_400_000) % s.cycleLength) + 1

  // Counted backwards from the next period, using her luteal length.
  const ovulationDay = s.cycleLength - s.lutealLength
  if (day <= s.periodLength) return 'menstrual'
  if (day < ovulationDay - 1) return 'follicular'
  if (day <= ovulationDay + 1) return 'ovulation'
  return 'luteal'
}

/** Where a resolved phase came from, so a surface can explain itself. */
export type PhaseSource = 'period-start' | 'logged' | 'dates' | null

export interface ResolvedPhase {
  phase: CyclePhaseKey | null
  source: PhaseSource
  /** One line she can check, in her own terms. */
  because: string | null
}

/**
 * Which phase she is actually in.
 *
 * There are two ways the app can know, and the old rule was "a logged phase
 * always wins". That rule broke on the most ordinary day of the month.
 *
 * The day her period arrived she opened the cycle settings and set the first
 * day to today — the clearest statement anyone can make about their cycle.
 * But she had already tapped 'luteal' on a check-in that morning, before it
 * started, and "logged always wins" meant a guess made a few hours earlier
 * outranked the event itself. Nutrition went on quoting luteal, with luteal's
 * extra 7% on calories and carbs, on day one of her period.
 *
 * So the rule is recency, not source — with one exception that is not really
 * an exception: the first day of bleeding is not an opinion about a phase, it
 * *is* the phase. When she has named a period start on or after the day she
 * last logged a phase, the dates win. Before that day, the logged phase wins,
 * because a woman who says she is bleeding early knows better than a 28-day
 * average.
 */
export function resolvePhase(
  input: {
    /** What she tapped on a check-in, and the date of that check-in. */
    loggedPhase: string | null
    loggedOn: string | null
    lastPeriodStart: string | null
    today?: string
  } & CycleShape,
): ResolvedPhase {
  const logged =
    input.loggedPhase && input.loggedPhase !== 'not_tracked'
      ? (input.loggedPhase as CyclePhaseKey)
      : null

  const s = cycleShape(input)
  const len = s.cycleLength
  const todayDate = input.today ? new Date(`${input.today}T12:00:00Z`) : new Date()

  /*
   * A start date goes stale.
   *
   * `phaseFromDates` takes the day count modulo the cycle length, so a date
   * from three months ago still returns a confident-looking "day 21 of your
   * cycle". After two cycles with no update that number is arithmetic, not
   * knowledge — it assumes every cycle since was exactly average and that she
   * simply stopped telling us. Better to fall through to whatever she last
   * said out loud, and say nothing if there is nothing.
   */
  const elapsed = input.lastPeriodStart ? cyclesSince(input.lastPeriodStart, len, todayDate) : null
  const datesAreStale = elapsed !== null && elapsed >= 2
  const fromDates = datesAreStale ? null : phaseFromDates(input.lastPeriodStart, s, todayDate)

  // Did she tell us about a period start at least as recently as she tapped a
  // phase? Same day counts — she is correcting this morning's guess.
  const periodIsNewer =
    !!input.lastPeriodStart && (!input.loggedOn || input.lastPeriodStart.slice(0, 10) >= input.loggedOn.slice(0, 10))

  if (fromDates && periodIsNewer) {
    const day = dayOfCycle(input.lastPeriodStart!, len, todayDate)
    return {
      phase: fromDates,
      source: 'period-start',
      because:
        day !== null && day <= s.periodLength
          ? `you said your period started ${day === 1 ? 'today' : `${day - 1} day${day === 2 ? '' : 's'} ago`}`
          : `day ${day} of your cycle, from the start date you gave`,
    }
  }

  if (logged) {
    return { phase: logged, source: 'logged', because: 'you logged this on your check-in' }
  }

  if (fromDates) {
    const day = dayOfCycle(input.lastPeriodStart!, len, todayDate)
    return { phase: fromDates, source: 'dates', because: `day ${day} of your cycle` }
  }

  return { phase: null, source: null, because: null }
}

/** How many full cycles have passed since that start date. */
function cyclesSince(lastPeriodStart: string, cycleLength: number, today: Date): number | null {
  const start = Date.parse(`${lastPeriodStart.slice(0, 10)}T00:00:00Z`)
  const now = Date.parse(`${today.toISOString().slice(0, 10)}T00:00:00Z`)
  if (Number.isNaN(start) || now < start) return null
  return Math.floor((now - start) / 86_400_000 / (cycleLength > 0 ? cycleLength : 28))
}

/** Which day of the cycle today is. Exported for the copy above and for tests. */
export function dayOfCycle(lastPeriodStart: string, cycleLength = 28, today = new Date()): number | null {
  const start = Date.parse(`${lastPeriodStart.slice(0, 10)}T00:00:00Z`)
  const now = Date.parse(`${today.toISOString().slice(0, 10)}T00:00:00Z`)
  if (Number.isNaN(start) || now < start) return null
  const len = cycleLength > 0 ? cycleLength : 28
  return (Math.floor((now - start) / 86_400_000) % len) + 1
}

export function phaseLabel(phase: CyclePhaseKey | null): string {
  return CYCLE_PHASES.find((p) => p.key === phase)?.label ?? 'Not tracked'
}

/** Named choices instead of a percentage nobody can reason about. */
export const CYCLE_CHOICES: { pct: number; label: string; blurb: string }[] = [
  { pct: -7, label: 'Notably less', blurb: 'appetite drops off' },
  { pct: -3, label: 'A little less', blurb: '' },
  { pct: 0, label: 'The same', blurb: 'no change' },
  { pct: 3, label: 'A little more', blurb: '' },
  { pct: 7, label: 'Notably more', blurb: 'hungrier, training harder' },
]

/** Nearest named choice to a stored percentage. */
export function nearestChoice(pct: number): number {
  return CYCLE_CHOICES.reduce((best, c) => (Math.abs(c.pct - pct) < Math.abs(best - pct) ? c.pct : best), 0)
}
