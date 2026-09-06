import Link from 'next/link'
import { Settings2 } from 'lucide-react'
import { NutrientRings } from '@/components/nutrient-rings'
import { NUTRIENT_BY_KEY, type NutrientKey, type NutrientMap } from '@/lib/nutrients'
import type { MealLog } from '@/lib/types'

type Row = MealLog & {
  custom_name?: string | null
  quantity?: number | null
  unit?: string | null
  calories?: number | null
  protein_g?: number | null
  group_id?: string | null
  meal_name?: string | null
}

const CHIPS: NutrientKey[] = ['water_ml', 'caffeine_mg', 'sugar_g', 'fiber_g']

/**
 * Today, on the Nutrition hub: the same rings, totals and logged list the
 * log screen shows, read from the same rows. Read-only here — logging and
 * removing happen on the log screen, one tap away.
 */
export function TodayNutrition({
  totals,
  nutrients,
  targets,
  panelTargets,
  hasGoals,
  loggedMeals,
}: {
  totals: NutrientMap
  nutrients: NutrientMap
  targets: Partial<Record<NutrientKey, number>>
  panelTargets: Partial<Record<NutrientKey, number>>
  hasGoals: boolean
  loggedMeals: MealLog[]
}) {
  const groups = new Map<string, { name: string; items: Row[]; calories: number; protein: number }>()
  for (const m of loggedMeals as Row[]) {
    const key = m.group_id ?? m.id
    const name = m.custom_name ?? m.recipe?.title ?? 'meal'
    const cal = m.calories ?? (m.recipe?.calories ?? 0) * (m.servings || 1)
    const pro = m.protein_g ?? (m.recipe?.protein_g ?? 0) * (m.servings || 1)
    const g = groups.get(key) ?? { name: m.meal_name ?? name, items: [], calories: 0, protein: 0 }
    g.items.push(m)
    g.calories += cal
    g.protein += pro
    groups.set(key, g)
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="font-serif text-[19px] font-semibold">Today&rsquo;s nutrition</p>
        <Link href="/app/nutrition/goals" aria-label="Your targets" className="rounded-full bg-card p-2 ring-1 ring-border">
          <Settings2 className="h-4 w-4 text-muted-foreground" />
        </Link>
      </div>

      <NutrientRings totals={totals} targets={targets} hasGoals={hasGoals} />

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-wrap gap-2">
          {CHIPS.map((k) => {
            const def = NUTRIENT_BY_KEY[k]
            const v = nutrients[k] ?? 0
            const t = panelTargets[k]
            return (
              <span key={k} className="rounded-full bg-muted px-3 py-1 text-[12.5px]">
                {def.label} {Math.round(v)}
                {t ? ` / ${t}` : ''} {def.unit}
              </span>
            )
          })}
        </div>

        <div className="flex flex-col gap-2 border-t border-border pt-3">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">logged today</p>
          {groups.size === 0 ? (
            <p className="text-sm text-muted-foreground">nothing yet.</p>
          ) : (
            [...groups.values()].map((g, i) => (
              <div key={i} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 flex-1">
                  <span className="font-medium">{g.name}</span>
                  {g.items.length > 1 && (
                    <span className="text-muted-foreground"> · {g.items.map((r) => r.custom_name ?? r.recipe?.title ?? 'meal').join(', ')}</span>
                  )}
                  {g.items.length === 1 && g.items[0].quantity != null && (
                    <span className="text-muted-foreground">
                      {' '}· {g.items[0].quantity} {g.items[0].unit}
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-muted-foreground">
                  {Math.round(g.calories)} cal · {Math.round(g.protein)} g
                </span>
              </div>
            ))
          )}
        </div>

        <Link href="/app/nutrition/log" className="flex h-[52px] items-center justify-center rounded-2xl bg-primary text-[17px] font-bold text-primary-foreground">
          Log what you ate
        </Link>
      </div>
    </section>
  )
}
