import Link from 'next/link'
import { NUTRIENT_BY_KEY, type NutrientKey, type NutrientMap } from '@/lib/nutrients'
import { cn } from '@/lib/utils'

/** Current against goal, so a day reads as "how far to go" rather than a bare number. */
export function NutrientRings({
  totals,
  targets,
  hasGoals,
}: {
  totals: NutrientMap
  targets: Partial<Record<NutrientKey, number>>
  hasGoals: boolean
}) {
  const keys: NutrientKey[] = ['calories', 'protein_g', 'carbs_g', 'fat_g']

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-4 gap-2">
        {keys.map((k) => {
          const def = NUTRIENT_BY_KEY[k]
          const value = Math.round(totals[k] ?? 0)
          const target = targets[k]
          const pct = target ? Math.min(Math.round((value / target) * 100), 100) : null
          const over = target ? value > target * 1.05 : false
          return (
            <div key={k} className="rounded-2xl border border-border bg-card px-2 py-3 text-center">
              <p className="font-serif text-[21px] font-semibold leading-none">{value}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">{target ? `of ${target}` : def.unit}</p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn('h-full rounded-full', over ? 'bg-primary' : 'bg-mindset-pillar')}
                  style={{ width: `${pct ?? 0}%` }}
                />
              </div>
              <p className="mt-1.5 text-[10px] uppercase tracking-[0.1em] text-muted-foreground">{def.label}</p>
            </div>
          )
        })}
      </div>

      {!hasGoals && (
        <Link href="/app/nutrition/goals" className="rounded-2xl border border-dashed border-border p-3.5 text-center">
          <span className="block text-[15px] font-semibold">Set your targets</span>
          <span className="mt-0.5 block text-[13px] text-muted-foreground">
            your weight and what you&rsquo;re working toward — the app does the rest
          </span>
        </Link>
      )}
    </div>
  )
}
