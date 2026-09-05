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
 * Which phase she is in, from the first day of her last period. Used only when
 * she has not logged a phase directly on a check-in.
 */
export function phaseFromDates(lastPeriodStart: string | null, cycleLength = 28, today = new Date()): CyclePhaseKey | null {
  if (!lastPeriodStart) return null
  const start = Date.parse(`${lastPeriodStart.slice(0, 10)}T00:00:00Z`)
  const now = Date.parse(`${today.toISOString().slice(0, 10)}T00:00:00Z`)
  if (Number.isNaN(start) || now < start) return null
  const len = cycleLength > 0 ? cycleLength : 28
  const day = (Math.floor((now - start) / 86_400_000) % len) + 1

  // Proportional to cycle length rather than fixed days, so a 24 or 34 day
  // cycle lands sensibly rather than being forced into a 28 day template.
  const ovulationDay = len - 14
  if (day <= 5) return 'menstrual'
  if (day < ovulationDay - 1) return 'follicular'
  if (day <= ovulationDay + 1) return 'ovulation'
  return 'luteal'
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
