import { NUTRIENTS, type NutrientKey } from '@/lib/nutrients'

/**
 * Dietary Reference Intakes by age and sex.
 *
 * These are the published general reference intakes for healthy people — the
 * same figures a nutrition label's "% daily value" is built from. They are a
 * guide, not a prescription, and they are deliberately not shown as a target a
 * child is failing to hit. Anything specific to a particular child belongs with
 * their doctor, and the app says so where the numbers are displayed.
 *
 * Calories are the softest figure here: real needs swing widely with growth and
 * activity, so the values are mid-range for a moderately active child.
 */

export type Sex = 'female' | 'male'

export interface DriBand {
  minAge: number
  maxAge: number
  targets: Partial<Record<NutrientKey, number>>
}

function band(minAge: number, maxAge: number, targets: Partial<Record<NutrientKey, number>>): DriBand {
  return { minAge, maxAge, targets }
}

const SHARED_CHILD = { vit_d_mcg: 15, caffeine_mg: 0 }

const FEMALE: DriBand[] = [
  band(1, 3, { sugar_g: 15, calories: 1200, protein_g: 13, fiber_g: 19, water_ml: 1300, calcium_mg: 700, iron_mg: 7, magnesium_mg: 80, zinc_mg: 3, potassium_mg: 2000, sodium_mg: 1200, vit_a_mcg: 300, vit_c_mg: 15, vit_e_mg: 6, vit_b12_mcg: 0.9, folate_mcg: 150, ...SHARED_CHILD }),
  band(4, 8, { sugar_g: 20, calories: 1600, protein_g: 19, fiber_g: 25, water_ml: 1700, calcium_mg: 1000, iron_mg: 10, magnesium_mg: 130, zinc_mg: 5, potassium_mg: 2300, sodium_mg: 1500, vit_a_mcg: 400, vit_c_mg: 25, vit_e_mg: 7, vit_b12_mcg: 1.2, folate_mcg: 200, ...SHARED_CHILD }),
  band(9, 13, { sugar_g: 25, calories: 1800, protein_g: 34, fiber_g: 26, water_ml: 2100, calcium_mg: 1300, iron_mg: 8, magnesium_mg: 240, zinc_mg: 8, potassium_mg: 2300, sodium_mg: 1800, vit_a_mcg: 600, vit_c_mg: 45, vit_e_mg: 11, vit_b12_mcg: 1.8, folate_mcg: 300, ...SHARED_CHILD }),
  band(14, 18, { sugar_g: 25, calories: 2000, protein_g: 46, fiber_g: 26, water_ml: 2300, calcium_mg: 1300, iron_mg: 15, magnesium_mg: 360, zinc_mg: 9, potassium_mg: 2300, sodium_mg: 2300, vit_a_mcg: 700, vit_c_mg: 65, vit_e_mg: 15, vit_b12_mcg: 2.4, folate_mcg: 400, ...SHARED_CHILD, caffeine_mg: 100 }),
  band(19, 150, { sugar_g: 25, calories: 2000, protein_g: 46, fiber_g: 28, water_ml: 2700, calcium_mg: 1000, iron_mg: 18, magnesium_mg: 320, zinc_mg: 8, potassium_mg: 2600, sodium_mg: 2300, vit_a_mcg: 700, vit_c_mg: 75, vit_e_mg: 15, vit_b12_mcg: 2.4, folate_mcg: 400, vit_d_mcg: 20, caffeine_mg: 400 }),
]

const MALE: DriBand[] = [
  band(1, 3, { sugar_g: 15, calories: 1200, protein_g: 13, fiber_g: 19, water_ml: 1300, calcium_mg: 700, iron_mg: 7, magnesium_mg: 80, zinc_mg: 3, potassium_mg: 2000, sodium_mg: 1200, vit_a_mcg: 300, vit_c_mg: 15, vit_e_mg: 6, vit_b12_mcg: 0.9, folate_mcg: 150, ...SHARED_CHILD }),
  band(4, 8, { sugar_g: 20, calories: 1600, protein_g: 19, fiber_g: 25, water_ml: 1700, calcium_mg: 1000, iron_mg: 10, magnesium_mg: 130, zinc_mg: 5, potassium_mg: 2300, sodium_mg: 1500, vit_a_mcg: 400, vit_c_mg: 25, vit_e_mg: 7, vit_b12_mcg: 1.2, folate_mcg: 200, ...SHARED_CHILD }),
  band(9, 13, { sugar_g: 25, calories: 2000, protein_g: 34, fiber_g: 31, water_ml: 2400, calcium_mg: 1300, iron_mg: 8, magnesium_mg: 240, zinc_mg: 8, potassium_mg: 2500, sodium_mg: 1800, vit_a_mcg: 600, vit_c_mg: 45, vit_e_mg: 11, vit_b12_mcg: 1.8, folate_mcg: 300, ...SHARED_CHILD }),
  band(14, 18, { sugar_g: 25, calories: 2600, protein_g: 52, fiber_g: 38, water_ml: 3300, calcium_mg: 1300, iron_mg: 11, magnesium_mg: 410, zinc_mg: 11, potassium_mg: 3000, sodium_mg: 2300, vit_a_mcg: 900, vit_c_mg: 75, vit_e_mg: 15, vit_b12_mcg: 2.4, folate_mcg: 400, ...SHARED_CHILD, caffeine_mg: 100 }),
  band(19, 150, { sugar_g: 36, calories: 2500, protein_g: 56, fiber_g: 34, water_ml: 3700, calcium_mg: 1000, iron_mg: 8, magnesium_mg: 420, zinc_mg: 11, potassium_mg: 3400, sodium_mg: 2300, vit_a_mcg: 900, vit_c_mg: 90, vit_e_mg: 15, vit_b12_mcg: 2.4, folate_mcg: 400, vit_d_mcg: 20, caffeine_mg: 400 }),
]

/** Sex unknown: take the gentler of the two, so nothing is overstated. */
function blend(a: Partial<Record<NutrientKey, number>>, b: Partial<Record<NutrientKey, number>>) {
  const out: Partial<Record<NutrientKey, number>> = {}
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)]) as Set<NutrientKey>) {
    const x = a[k]
    const y = b[k]
    if (typeof x === 'number' && typeof y === 'number') out[k] = Math.min(x, y)
    else out[k] = x ?? y
  }
  return out
}

export function driFor(age: number | null, sex: Sex | null): Partial<Record<NutrientKey, number>> | null {
  if (age === null || age < 1 || age > 120) return null
  // Adults also get the general adult figures for anything a band doesn't name
  // (saturated fat, vitamin K, the B vitamins, trace minerals). Children only
  // get what their band states, so nothing adult-sized is implied for them.
  const adultDefaults = Object.fromEntries(NUTRIENTS.filter((n) => n.target != null).map((n) => [n.key, n.target])) as Partial<Record<NutrientKey, number>>
  const pick = (bands: DriBand[]) => {
    const t = bands.find((b) => age >= b.minAge && age <= b.maxAge)?.targets ?? null
    return t && age >= 19 ? { ...adultDefaults, ...t } : t
  }
  if (sex === 'female') return pick(FEMALE)
  if (sex === 'male') return pick(MALE)
  const f = pick(FEMALE)
  const m = pick(MALE)
  return f && m ? blend(f, m) : (f ?? m)
}

export function ageFromBirthYear(birthYear: number | null, today = new Date()): number | null {
  if (!birthYear) return null
  const age = today.getFullYear() - birthYear
  return age >= 0 && age <= 120 ? age : null
}

/** True where the figure is a ceiling to stay under rather than a goal to reach. */
export const LIMIT_NUTRIENTS: NutrientKey[] = ['sodium_mg', 'sat_fat_g', 'sugar_g', 'caffeine_mg']
