'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { saveCycleSettings } from '@/app/actions'
import {
  CYCLE_CHOICES,
  CYCLE_DEFAULTS,
  CYCLE_PHASES,
  DEFAULT_ADJUSTMENTS,
  cycleShape,
  nearestChoice,
  phaseFromDates,
  phaseLabel,
  type CyclePhaseKey,
} from '@/lib/cycle'
import { CyclePhaseSwitch } from '@/components/cycle-phase-switch'
import type { PhaseSource } from '@/lib/cycle'
import { cn } from '@/lib/utils'

/**
 * Her cycle, at the detail a real cycle has.
 *
 * This page is where she came looking on the day her period started, and it
 * had a date field, a cycle length and a column of calorie percentages — no
 * way to say what phase she was in, and no visible sign that the date she had
 * just typed had changed anything. So two things are different.
 *
 * First: the phase switch is at the top, before any of the arithmetic. It is
 * the question she came here to answer.
 *
 * Second: the numbers underneath are hers. A five day period and ovulation on
 * day fourteen used to be constants inside a function — population averages
 * wearing the costume of a personal setting. A woman who bleeds for seven days
 * was being told she was follicular on day six, and given follicular's calorie
 * figure while she was still bleeding.
 */
export function CycleSettingsForm({
  initial,
  baseCalories,
  current,
}: {
  initial: {
    lastPeriodStart: string
    cycleLength: string
    periodLength: string
    lutealLength: string
    isRegular: boolean | null
    adjustments: Partial<Record<CyclePhaseKey, number>>
  }
  baseCalories: number | null
  /** What the app currently believes, resolved the same way every page does. */
  current: { phase: CyclePhaseKey | null; source: PhaseSource; because: string | null }
}) {
  const [start, setStart] = useState(initial.lastPeriodStart)
  const [len, setLen] = useState(initial.cycleLength)
  const [periodLen, setPeriodLen] = useState(initial.periodLength)
  const [lutealLen, setLutealLen] = useState(initial.lutealLength)
  const [regular, setRegular] = useState(initial.isRegular !== false)
  const [adj, setAdj] = useState<Record<string, number>>(() => {
    const merged: Record<string, number> = { ...DEFAULT_ADJUSTMENTS, ...initial.adjustments }
    // snap anything stored as an odd percentage onto the nearest named choice
    for (const k of Object.keys(merged)) merged[k] = nearestChoice(merged[k])
    return merged
  })
  const [pending, startTransition] = useTransition()

  const num = (v: string) => (v.trim() === '' ? null : Number(v))
  const shape = cycleShape({
    cycleLength: num(len),
    periodLength: num(periodLen),
    lutealLength: num(lutealLen),
    isRegular: regular,
  })

  // Recomputed as she types, so the effect of a change is visible before she
  // saves it rather than three pages away afterwards.
  const phaseToday = phaseFromDates(start || null, shape)
  const ovulationDay = shape.cycleLength - shape.lutealLength

  function save() {
    startTransition(async () => {
      const res = await saveCycleSettings({
        lastPeriodStart: start || null,
        cycleLengthDays: num(len),
        periodLengthDays: num(periodLen),
        lutealLengthDays: num(lutealLen),
        isRegular: regular,
        adjustments: adj,
      })
      if ('error' in res && res.error) {
        toast.error(res.error)
        return
      }
      toast.success(phaseToday ? `Saved — ${phaseLabel(phaseToday)} today.` : 'Cycle settings saved')
    })
  }

  const field =
    'h-12 w-full rounded-xl bg-background px-3 text-base outline-none ring-1 ring-border focus-visible:ring-2 focus-visible:ring-primary/40'

  return (
    <div className="flex flex-col gap-4">
      {/*
        The switch, first and on its own. Everything below it is settings; this
        is the one thing she is most likely to have opened the page to do.
      */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="mb-2.5 text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">Where you are today</p>
        <CyclePhaseSwitch phase={current.phase} source={current.source} because={current.because} />
        {!current.phase && (
          <p className="mt-2 text-[13px] text-muted-foreground text-pretty">
            Nothing set yet. Tap change, or fill in the dates below and the app works it out.
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">Your cycle</p>
        <p className="mb-3 text-[13px] text-muted-foreground text-pretty">
          no two are the same. the more of this you fill in, the less the app has to assume.
        </p>

        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="mb-1 block text-[12px] text-muted-foreground">last period started</span>
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className={field} />
          </label>
          <label className="block">
            <span className="mb-1 block text-[12px] text-muted-foreground">cycle length (days)</span>
            <input
              value={len}
              onChange={(e) => setLen(e.target.value)}
              inputMode="numeric"
              placeholder={String(CYCLE_DEFAULTS.cycleLength)}
              className={field}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[12px] text-muted-foreground">days you bleed</span>
            <input
              value={periodLen}
              onChange={(e) => setPeriodLen(e.target.value)}
              inputMode="numeric"
              placeholder={String(CYCLE_DEFAULTS.periodLength)}
              className={field}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[12px] text-muted-foreground">luteal phase (days)</span>
            <input
              value={lutealLen}
              onChange={(e) => setLutealLen(e.target.value)}
              inputMode="numeric"
              placeholder={String(CYCLE_DEFAULTS.lutealLength)}
              className={field}
            />
          </label>
        </div>

        {/*
          Why the app asks for the luteal length rather than an ovulation day.
          It is the stable half; the follicular phase is what stretches, which
          is why counting back from the next period is more reliable than
          counting forward from the last one.
        */}
        <p className="mt-2 text-[12px] text-muted-foreground text-pretty">
          The luteal phase is the steady half — usually 12 to 14 days, and much the same every month.
          It is the first half that stretches and shrinks. Leave anything blank and the app uses the average.
        </p>

        <label className="mt-3 flex items-start gap-2.5">
          <input
            type="checkbox"
            checked={!regular}
            onChange={(e) => setRegular(!e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--mindset-pillar)]"
          />
          <span className="text-[13px] text-pretty">
            <span className="font-medium">my cycle is irregular</span>
            <span className="block text-muted-foreground">
              stops the app working a phase out from dates — it will use only what you set above.
            </span>
          </span>
        </label>

        {regular && phaseToday ? (
          <div className="mt-3 rounded-xl bg-secondary/60 p-3">
            <p className="text-[13px] text-pretty">
              These numbers put you in the{' '}
              <span className="font-semibold">{phaseLabel(phaseToday)}</span> phase today, with ovulation
              around day {ovulationDay}.
            </p>
            {current.phase && current.phase !== phaseToday && current.source === 'logged' && (
              <p className="mt-1 text-[12px] text-muted-foreground text-pretty">
                You logged {phaseLabel(current.phase)} more recently, so that is what the app is using.
                Saving a new period start above will take over.
              </p>
            )}
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
          How much you eat, by phase
        </p>
        <p className="mb-3 text-[13px] text-muted-foreground text-pretty">
          how much you actually want to eat changes across the month. set each phase to what is true for
          you — the calorie figure updates as you choose.
        </p>

        <div className="flex flex-col gap-4">
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
                    {shifted && pct !== 0
                      ? ` (${pct > 0 ? '+' : ''}${Math.round(baseCalories! * (pct / 100))})`
                      : ''}
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
          Applied to calories and carbs. Protein and water stay flat. &ldquo;Typical&rdquo; marks what most
          women find, but yours is the one that counts.
        </p>
      </div>

      <button
        type="button"
        onClick={save}
        disabled={pending}
        className="h-[52px] w-full rounded-2xl bg-primary text-[17px] font-bold text-primary-foreground disabled:opacity-50"
      >
        {pending ? 'Saving…' : 'Save cycle settings'}
      </button>
    </div>
  )
}
