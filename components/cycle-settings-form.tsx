'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { saveCycleSettings } from '@/app/actions'
import { CYCLE_PHASES, DEFAULT_ADJUSTMENTS, phaseFromDates, type CyclePhaseKey } from '@/lib/cycle'
import { cn } from '@/lib/utils'

/**
 * Every phase is adjustable. The defaults follow the usual population finding,
 * but a woman who runs the other way should be able to say so.
 */
export function CycleSettingsForm({
  initial,
}: {
  initial: { lastPeriodStart: string; cycleLength: string; adjustments: Partial<Record<CyclePhaseKey, number>> }
}) {
  const [start, setStart] = useState(initial.lastPeriodStart)
  const [len, setLen] = useState(initial.cycleLength || '28')
  const [adj, setAdj] = useState<Record<string, number>>({ ...DEFAULT_ADJUSTMENTS, ...initial.adjustments })
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
        targets shift with the phase instead of being the same every week.
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

      <div className="mt-4 flex flex-col gap-2.5">
        {CYCLE_PHASES.map((p) => (
          <div key={p.key} className="flex items-center gap-3">
            <span className="min-w-0 flex-1">
              <span className="block text-[14.5px] font-medium">{p.label}</span>
              <span className="block text-[12px] text-muted-foreground">{p.blurb}</span>
            </span>
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={() => setAdj({ ...adj, [p.key]: Math.max((adj[p.key] ?? 0) - 1, -30) })}
                aria-label={`less in ${p.label}`}
                className="h-9 w-9 rounded-full bg-muted text-lg font-semibold"
              >
                −
              </button>
              <span className={cn('w-12 text-center text-[15px] font-semibold', (adj[p.key] ?? 0) > 0 && 'text-mindset-pillar', (adj[p.key] ?? 0) < 0 && 'text-primary')}>
                {(adj[p.key] ?? 0) > 0 ? '+' : ''}
                {adj[p.key] ?? 0}%
              </span>
              <button
                type="button"
                onClick={() => setAdj({ ...adj, [p.key]: Math.min((adj[p.key] ?? 0) + 1, 30) })}
                aria-label={`more in ${p.label}`}
                className="h-9 w-9 rounded-full bg-muted text-lg font-semibold"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-3 text-[12.5px] text-muted-foreground text-pretty">
        Applied to calories and carbs. Protein stays flat — the reason to eat it doesn&rsquo;t change week to week.
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
