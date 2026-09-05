import type { NutrientKey } from '@/lib/nutrients'

/**
 * Turns her body and her goal into daily targets.
 *
 * These are the standard estimates a coach would start from, not a
 * prescription — every one can be overridden by hand, and the app says
 * plainly that they are a starting point.
 */

export type BodyGoal = 'lose_fat' | 'maintain' | 'gain_muscle'
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'

export const BODY_GOALS: { key: BodyGoal; label: string; blurb: string }[] = [
  { key: 'lose_fat', label: 'Lose fat', blurb: 'a modest deficit, protein kept high' },
  { key: 'maintain', label: 'Maintain', blurb: 'hold steady, train consistently' },
  { key: 'gain_muscle', label: 'Gain muscle', blurb: 'a small surplus, protein led' },
]

export const ACTIVITY_LEVELS: { key: ActivityLevel; label: string; factor: number }[] = [
  { key: 'sedentary', label: 'Mostly sitting', factor: 1.2 },
  { key: 'light', label: 'Light — a walk most days', factor: 1.375 },
  { key: 'moderate', label: 'Moderate — training 3–5 days', factor: 1.55 },
  { key: 'active', label: 'Active — training 6–7 days', factor: 1.725 },
  { key: 'very_active', label: 'Very active — physical job too', factor: 1.9 },
]

/** Protein per kg of bodyweight. Higher when building or when in a deficit. */
const PROTEIN_PER_KG: Record<BodyGoal, number> = { lose_fat: 2.2, maintain: 1.6, gain_muscle: 1.8 }
const CALORIE_SHIFT: Record<BodyGoal, number> = { lose_fat: -0.15, maintain: 0, gain_muscle: 0.1 }

export interface BodyInput {
  weightKg: number | null
  heightCm: number | null
  birthYear: number | null
  activity: ActivityLevel | null
  goal: BodyGoal | null
}

export interface CalculatedTargets {
  calories: number | null
  protein_g: number | null
  carbs_g: number | null
  fat_g: number | null
  water_ml: number | null
  /** How the numbers were reached, shown to her rather than hidden. */
  basis: string[]
}

export function calculateTargets(input: BodyInput): CalculatedTargets {
  const { weightKg, heightCm, birthYear, activity, goal } = input
  const basis: string[] = []
  if (!weightKg) return { calories: null, protein_g: null, carbs_g: null, fat_g: null, water_ml: null, basis }

  const g = goal ?? 'maintain'
  const protein = Math.round(weightKg * PROTEIN_PER_KG[g])
  basis.push(`${PROTEIN_PER_KG[g]}g of protein per kg for ${BODY_GOALS.find((b) => b.key === g)?.label.toLowerCase()}`)

  // Water: roughly 35ml per kg, a common starting point.
  const water = Math.round((weightKg * 35) / 50) * 50
  basis.push('35ml of water per kg')

  let calories: number | null = null
  if (heightCm && birthYear) {
    // Mifflin-St Jeor, using the female equation.
    const age = new Date().getFullYear() - birthYear
    const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161
    const factor = ACTIVITY_LEVELS.find((a) => a.key === (activity ?? 'moderate'))?.factor ?? 1.55
    calories = Math.round((bmr * factor * (1 + CALORIE_SHIFT[g])) / 10) * 10
    basis.push(`Mifflin-St Jeor at ${factor}× activity${CALORIE_SHIFT[g] ? `, ${CALORIE_SHIFT[g] > 0 ? '+' : ''}${Math.round(CALORIE_SHIFT[g] * 100)}%` : ''}`)
  } else {
    // Without height and age, fall back to a bodyweight multiplier.
    const perKg = g === 'gain_muscle' ? 35 : g === 'lose_fat' ? 26 : 31
    calories = Math.round((weightKg * perKg) / 10) * 10
    basis.push(`${perKg} cal per kg (add height and year of birth for a closer estimate)`)
  }

  // Fat at 25% of calories, carbs take the remainder.
  const fat = calories ? Math.round((calories * 0.25) / 9) : null
  const carbs = calories && fat ? Math.max(Math.round((calories - protein * 4 - fat * 9) / 4), 0) : null

  return { calories, protein_g: protein, carbs_g: carbs, fat_g: fat, water_ml: water, basis }
}

export function lbToKg(lb: number): number {
  return Math.round(lb * 0.45359237 * 10) / 10
}
export function kgToLb(kg: number): number {
  return Math.round((kg / 0.45359237) * 10) / 10
}

/** Calculated targets, with anything she set by hand taking precedence. */
export function effectiveTargets(
  calculated: CalculatedTargets,
  overrides: Partial<Record<NutrientKey, number>> = {},
): Partial<Record<NutrientKey, number>> {
  const out: Partial<Record<NutrientKey, number>> = {}
  if (calculated.calories) out.calories = calculated.calories
  if (calculated.protein_g) out.protein_g = calculated.protein_g
  if (calculated.carbs_g) out.carbs_g = calculated.carbs_g
  if (calculated.fat_g) out.fat_g = calculated.fat_g
  if (calculated.water_ml) out.water_ml = calculated.water_ml
  return { ...out, ...overrides }
}
