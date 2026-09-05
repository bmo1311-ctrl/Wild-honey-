'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { saveCycleSettings } from '@/app/actions'
import { CYCLE_CHOICES, CYCLE_PHASES, DEFAULT_ADJUSTMENTS, nearestChoice, phaseFromDates, type CyclePhaseKey } from '@/lib/cycle'
import { cn } from '@/lib/utils'

/**
 * Every phase is adjustable. The defaults follow the usual population finding,
 * but a woman who runs the other way should be able to say so.
 */
export function CycleSettingsForm({
  initial,
  baseCalories,
}: {
  initial: { lastPeriodStart: string; cycleLength: string; adjustments: Partial<Record<CyclePhaseKey, number>> }
  baseCalories: number | null
}) {
  const [start, setStart] = useState(initial.lastPeriodStart)
  const [len, setLen] = useState(initial.cycleLength || '28')
  const [adj, setAdj] = useState<Record<string, number>>(() => {
    const merged: Record<string, number> = { ...DEFAULT_ADJUSTMENTS, ...initial.adjustments }
    // snap anything stored as an odd percentage onto the nearest named choice
    for (const k of Object.keys(merged)) merged[k] = nearestChoice(merged[k])
    return merged
  })
  const [pending, startTransition] = useTransition()

  const phaseToday = phaseFromDates(start || null, Number(len) || 28)

  function save() {
    startTransition(async () => {
      const res = await saveCycleSettings({
        lastPeriodStart: start || null,
        cycleLengthDays: Number(len) || null,
        adjustments: adj,
      })
      if ('error' in res && res.error) {
        toast.error(res.error)
        return
      }
      toast.success('Cycle settings saved')
    })
  }

  const field = 'h-12 w-full rounded-xl bg-background px-3 text-base outline-none ring-1 ring-border focus-visible:ring-2 focus-visible:ring-primary/40'

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">Your cycle</p>
      <p className="mb-3 text-[13px] text-muted-foreground text-pretty">
        how much you actually want to eat changes across the month. set each phase to what is true for you — the calorie figure updates as you choose.
      </p>

      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="mb-1 block text-[12px] text-muted-foreground">last period started</span>
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className={field} />
        </label>
        <label className="block">
          <span className="mb-1 block text-[12px] text-muted-foreground">cycle length (days)</span>
          <input value={len} onChange={(e) => setLen(e.target.value)} inputMode="numeric" className={field} />
        </label>
      </div>

      {phaseToday && (
        <p className="mt-2.5 text-[13px] text-muted-foreground">
          that puts you in the <span className="font-semibold text-foreground">{phaseToday}</span> phase today
        </p>
      )}

      <div className="mt-4 flex flex-col gap-4">
        {CYCLE_PHASES.map((p) => {
          const pct = adj[p.key] ?? 0
          const shifted = baseCalories ? Math.round((baseCalories * (1 + pct / 100)) / 10) * 10 : null
          const isDefault = pct === DEFAULT_ADJUSTMENTS[p.key]
          return (
            <div key={p.key}>
              <div className="mb-1.5 flex items-baseline justify-between gap-2">
                <span className="text-[15px] font-semibold">{p.label}</span>
                <span className="text-[13px] text-muted-foreground">
                  {shifted ? `${shifted} cal` : `${pct > 0 ? '+' : ''}${pct}%`}
                  {shifted && pct !== 0 ? ` (${pct > 0 ? '+' : ''}${Math.round(baseCalories! * (pct / 100))})` : ''}
                </span>
              </div>
              <div className="flex gap-1.5">
                {CYCLE_CHOICES.map((c) => (
                  <button
                    key={c.pct}
                    type="button"
                    onClick={() => setAdj({ ...adj, [p.key]: c.pct })}
                    className={cn(
                      'h-11 flex-1 rounded-xl text-[12px] font-medium leading-tight transition-colors',
                      pct === c.pct ? 'bg-mindset-pillar text-white' : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-[11.5px] text-muted-foreground">
                {p.blurb}
                {isDefault && DEFAULT_ADJUSTMENTS[p.key] !== 0 ? ' · typical' : ''}
              </p>
            </div>
          )
        })}
      </div>

      <p className="mt-3 text-[12.5px] text-muted-foreground text-pretty">
        Applied to calories and carbs. Protein and water stay flat. &ldquo;Typical&rdquo; marks what most women find, but yours is the one that counts.
      </p>

      <button
        type="button"
        onClick={save}
        disabled={pending}
        className="mt-4 h-[52px] w-full rounded-2xl bg-primary text-[17px] font-bold text-primary-foreground disabled:opacity-50"
      >
        {pending ? 'Saving…' : 'Save cycle settings'}
      </button>
    </div>
  )
}
