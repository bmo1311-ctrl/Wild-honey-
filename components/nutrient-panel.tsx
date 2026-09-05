'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { NUTRIENTS, type NutrientKey, type NutrientMap } from '@/lib/nutrients'
import { LIMIT_NUTRIENTS } from '@/lib/dri'
import { cn } from '@/lib/utils'

const GROUP_LABEL: Record<string, string> = {
  macro: 'Macros',
  hydration: 'Hydration',
  mineral: 'Minerals',
  vitamin: 'Vitamins',
}

/**
 * Everything tracked, against the target for whoever is selected. Macros and
 * hydration stay open because they are the daily decisions; minerals and
 * vitamins fold away so the screen is not a wall of numbers.
 */
export function NutrientPanel({
  totals,
  targets,
  note,
}: {
  totals: NutrientMap
  targets: Partial<Record<NutrientKey, number>>
  note?: string
}) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ macro: true, hydration: true })

  const groups = ['macro', 'hydration', 'mineral', 'vitamin'] as const

  return (
    <div className="flex flex-col gap-3">
      {groups.map((g) => {
        const rows = NUTRIENTS.filter((n) => n.group === g)
        const open = openGroups[g]
        const met = rows.filter((n) => {
          const t = targets[n.key]
          const v = totals[n.key] ?? 0
          return t ? (LIMIT_NUTRIENTS.includes(n.key) ? v <= t : v >= t * 0.9) : false
        }).length
        const counted = rows.filter((n) => targets[n.key]).length

        return (
          <section key={g} className="overflow-hidden rounded-2xl border border-border bg-card">
            <button
              type="button"
              onClick={() => setOpenGroups((o) => ({ ...o, [g]: !o[g] }))}
              aria-expanded={open}
              className="flex w-full items-center gap-3 px-4 py-3 text-left"
            >
              <span className="flex-1 text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">{GROUP_LABEL[g]}</span>
              {counted > 0 && (
                <span className="text-xs text-muted-foreground">
                  {met}/{counted} on track
                </span>
              )}
              <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} />
            </button>

            {open && (
              <div className="flex flex-col gap-3 px-4 pb-4">
                {rows.map((n) => {
                  const value = totals[n.key] ?? 0
                  const target = targets[n.key]
                  const isLimit = LIMIT_NUTRIENTS.includes(n.key)
                  const pct = target ? Math.min(Math.round((value / target) * 100), 100) : null
                  const over = target ? value > target : false
                  const shown = value >= 100 ? Math.round(value) : Math.round(value * 10) / 10
                  return (
                    <div key={n.key}>
                      <div className="mb-1 flex items-baseline justify-between gap-3">
                        <span className="text-[14px] font-medium">{n.label}</span>
                        <span className="shrink-0 text-[13px] text-muted-foreground">
                          {shown}
                          {target ? ` / ${target}` : ''} {n.unit}
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            isLimit ? (over ? 'bg-primary' : 'bg-mindset-pillar') : over ? 'bg-mindset-pillar' : 'bg-mindset-pillar',
                          )}
                          style={{ width: `${pct ?? 0}%` }}
                        />
                      </div>
                      {isLimit && over && <p className="mt-1 text-[11px] text-primary">over the suggested limit</p>}
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        )
      })}

      {note && <p className="text-[12.5px] leading-[1.45] text-pretty text-muted-foreground">{note}</p>}
    </div>
  )
}
