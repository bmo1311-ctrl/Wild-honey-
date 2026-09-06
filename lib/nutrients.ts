/**
 * The nutrients the app tracks.
 *
 * Adding one is a single entry here — nothing in the database changes, because
 * values live in a jsonb map on food_items and meal_logs. Targets are general
 * adult daily reference intakes, shown as orientation rather than medical
 * advice, and every one of them can be left null.
 */

export type NutrientKey =
  | 'calories' | 'protein_g' | 'carbs_g' | 'fat_g'
  | 'fiber_g' | 'sugar_g' | 'sat_fat_g'
  | 'water_ml' | 'caffeine_mg' | 'sodium_mg' | 'potassium_mg' | 'calcium_mg' | 'iron_mg'
  | 'magnesium_mg' | 'zinc_mg'
  | 'vit_a_mcg' | 'vit_c_mg' | 'vit_d_mcg' | 'vit_e_mg' | 'vit_k_mcg' | 'vit_b1_mg' | 'vit_b2_mg' | 'vit_b3_mg' | 'vit_b6_mg' | 'vit_b12_mcg' | 'folate_mcg' | 'choline_mg'
  | 'phosphorus_mg' | 'copper_mg' | 'manganese_mg' | 'selenium_mcg'

export interface NutrientDef {
  key: NutrientKey
  label: string
  unit: string
  /** General adult daily reference intake, or null where there isn't a simple one. */
  target: number | null
  group: 'macro' | 'hydration' | 'mineral' | 'vitamin'
}

export const NUTRIENTS: NutrientDef[] = [
  { key: 'calories', label: 'Calories', unit: 'cal', target: null, group: 'macro' },
  { key: 'protein_g', label: 'Protein', unit: 'g', target: null, group: 'macro' },
  { key: 'carbs_g', label: 'Carbs', unit: 'g', target: null, group: 'macro' },
  { key: 'fat_g', label: 'Fat', unit: 'g', target: null, group: 'macro' },
  { key: 'fiber_g', label: 'Fibre', unit: 'g', target: 28, group: 'macro' },
  { key: 'sugar_g', label: 'Sugar', unit: 'g', target: null, group: 'macro' },
  { key: 'sat_fat_g', label: 'Saturated fat', unit: 'g', target: 20, group: 'macro' },

  { key: 'water_ml', label: 'Water', unit: 'ml', target: 2700, group: 'hydration' },
  { key: 'caffeine_mg', label: 'Caffeine', unit: 'mg', target: 400, group: 'hydration' },

  { key: 'sodium_mg', label: 'Sodium', unit: 'mg', target: 2300, group: 'mineral' },
  { key: 'potassium_mg', label: 'Potassium', unit: 'mg', target: 2600, group: 'mineral' },
  { key: 'calcium_mg', label: 'Calcium', unit: 'mg', target: 1000, group: 'mineral' },
  { key: 'iron_mg', label: 'Iron', unit: 'mg', target: 18, group: 'mineral' },
  { key: 'magnesium_mg', label: 'Magnesium', unit: 'mg', target: 320, group: 'mineral' },
  { key: 'zinc_mg', label: 'Zinc', unit: 'mg', target: 8, group: 'mineral' },
  { key: 'phosphorus_mg', label: 'Phosphorus', unit: 'mg', target: 700, group: 'mineral' },
  { key: 'copper_mg', label: 'Copper', unit: 'mg', target: 0.9, group: 'mineral' },
  { key: 'manganese_mg', label: 'Manganese', unit: 'mg', target: 1.8, group: 'mineral' },
  { key: 'selenium_mcg', label: 'Selenium', unit: 'mcg', target: 55, group: 'mineral' },

  { key: 'vit_a_mcg', label: 'Vitamin A', unit: 'mcg', target: 700, group: 'vitamin' },
  { key: 'vit_c_mg', label: 'Vitamin C', unit: 'mg', target: 75, group: 'vitamin' },
  { key: 'vit_d_mcg', label: 'Vitamin D', unit: 'mcg', target: 20, group: 'vitamin' },
  { key: 'vit_e_mg', label: 'Vitamin E', unit: 'mg', target: 15, group: 'vitamin' },
  { key: 'vit_b12_mcg', label: 'Vitamin B12', unit: 'mcg', target: 2.4, group: 'vitamin' },
  { key: 'folate_mcg', label: 'Folate', unit: 'mcg', target: 400, group: 'vitamin' },
  { key: 'vit_k_mcg', label: 'Vitamin K', unit: 'mcg', target: 90, group: 'vitamin' },
  { key: 'vit_b1_mg', label: 'Thiamin (B1)', unit: 'mg', target: 1.1, group: 'vitamin' },
  { key: 'vit_b2_mg', label: 'Riboflavin (B2)', unit: 'mg', target: 1.1, group: 'vitamin' },
  { key: 'vit_b3_mg', label: 'Niacin (B3)', unit: 'mg', target: 14, group: 'vitamin' },
  { key: 'vit_b6_mg', label: 'Vitamin B6', unit: 'mg', target: 1.3, group: 'vitamin' },
  { key: 'choline_mg', label: 'Choline', unit: 'mg', target: 425, group: 'vitamin' },
]

export const NUTRIENT_BY_KEY: Record<string, NutrientDef> = Object.fromEntries(NUTRIENTS.map((n) => [n.key, n]))

export type NutrientMap = Partial<Record<NutrientKey, number>>

/** Scale a food's per-serving nutrients by how much she actually had. */
export function scaleNutrients(n: NutrientMap, factor: number): NutrientMap {
  const out: NutrientMap = {}
  for (const [k, v] of Object.entries(n)) {
    if (typeof v === 'number' && Number.isFinite(v)) out[k as NutrientKey] = Math.round(v * factor * 100) / 100
  }
  return out
}

export function sumNutrients(maps: NutrientMap[]): NutrientMap {
  const out: NutrientMap = {}
  for (const m of maps) {
    for (const [k, v] of Object.entries(m)) {
      if (typeof v !== 'number' || !Number.isFinite(v)) continue
      out[k as NutrientKey] = Math.round(((out[k as NutrientKey] ?? 0) + v) * 100) / 100
    }
  }
  return out
}

export interface NutrientProgress {
  def: NutrientDef
  value: number
  target: number | null
  pct: number | null
}

/** What she has had today against the reference intake, grouped for display. */
export function nutrientProgress(totals: NutrientMap, overrides: Partial<Record<NutrientKey, number | null>> = {}): NutrientProgress[] {
  return NUTRIENTS.map((def) => {
    const value = totals[def.key] ?? 0
    const target = overrides[def.key] ?? def.target
    return { def, value, target, pct: target ? Math.min(Math.round((value / target) * 100), 999) : null }
  })
}
