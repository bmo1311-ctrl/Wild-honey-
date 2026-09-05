'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check } from 'lucide-react'
import { addVitalityCheckin, saveCheckin } from '@/app/actions'
import { CYCLE_PHASES } from '@/lib/cycle'
import type { Checkin } from '@/lib/types'
import { cn } from '@/lib/utils'

const SCALES = [
  { key: 'energy', label: 'Energy', low: 'flat', high: 'buzzing' },
  { key: 'sleep_quality', label: 'Sleep', low: 'rough night', high: 'slept well' },
  { key: 'stress', label: 'Stress', low: 'calm', high: 'wired' },
] as const

/**
 * One screen, one job. The cycle phase asked here is the same one the
 * nutrition targets use, so answering it moves today's numbers.
 */
const MORE = [
  { key: 'mood', label: 'Mood' },
  { key: 'confidence', label: 'Confidence' },
  { key: 'motivation', label: 'Motivation' },
  { key: 'mental_clarity', label: 'Mental clarity' },
  { key: 'physical_strength', label: 'Physical strength' },
] as const

export function DailyCheckin({ existing, hasBaseline }: { existing: Checkin | null; hasBaseline: boolean }) {
  const [more, setMore] = useState(!hasBaseline)
  const [extra, setExtra] = useState<Record<string, number | null>>({})
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [v, setV] = useState<Record<string, number | null>>({
    energy: existing?.energy ?? null,
    sleep_quality: existing?.sleep_quality ?? null,
    stress: existing?.stress ?? null,
  })
  const [phase, setPhase] = useState<string | null>(existing?.cycle_phase ?? null)
  const [movement, setMovement] = useState(existing?.movement_minutes ? String(existing.movement_minutes) : '')

  const answered = SCALES.filter((s) => v[s.key]).length

  function save() {
    startTransition(async () => {
      const res = await saveCheckin({
        energy: v.energy ?? undefined,
        sleepQuality: v.sleep_quality ?? undefined,
        stress: v.stress ?? undefined,
        movementMinutes: Number(movement) || undefined,
        cyclePhase: phase ?? undefined,
      })
      if (res && 'error' in res && res.error) {
        toast.error(res.error)
        return
      }
      // The same numbers feed Your becoming. First one is her "before".
      const snapshot: Record<string, number> = {}
      if (v.energy) snapshot.energy = v.energy
      if (v.sleep_quality) snapshot.sleep = v.sleep_quality
      if (v.stress) snapshot.stress = v.stress
      for (const m of MORE) if (extra[m.key]) snapshot[m.key] = extra[m.key] as number
      if (Object.keys(snapshot).length) await addVitalityCheckin(snapshot, undefined, hasBaseline ? 'checkpoint' : 'baseline')
      toast.success(hasBaseline ? 'Logged' : 'Logged — this is your before.')
      router.push('/app')
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-5">
      {SCALES.map((s) => (
        <div key={s.key} className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-2 flex items-baseline justify-between">
            <p className="font-serif text-[18px] font-semibold">{s.label}</p>
            <span className="text-sm text-muted-foreground">{v[s.key] ? `${v[s.key]}/10` : '—'}</span>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                aria-label={`${s.label} ${n} out of 10`}
                onClick={() => setV((prev) => ({ ...prev, [s.key]: n }))}
                className={cn('h-10 flex-1 rounded-md transition-colors', v[s.key] && n <= (v[s.key] as number) ? 'bg-mindset-pillar' : 'bg-muted')}
              />
            ))}
          </div>
          <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
            <span>{s.low}</span>
            <span>{s.high}</span>
          </div>
        </div>
      ))}

      {more ? (
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="font-serif text-[18px] font-semibold">A bit more</p>
          <p className="mt-0.5 text-[13px] text-muted-foreground">{hasBaseline ? 'optional — this is what Your becoming compares over time.' : 'this becomes your before. optional, but worth a minute.'}</p>
          <div className="mt-3 flex flex-col gap-3">
            {MORE.map((m) => (
              <div key={m.key}>
                <div className="mb-1 flex items-baseline justify-between"><span className="text-sm font-medium">{m.label}</span><span className="text-xs text-muted-foreground">{extra[m.key] ? `${extra[m.key]}/10` : '—'}</span></div>
                <div className="flex gap-1">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <button key={n} type="button" aria-label={`${m.label} ${n} out of 10`} onClick={() => setExtra((p) => ({ ...p, [m.key]: n }))} className={cn('h-8 flex-1 rounded-md transition-colors', extra[m.key] && n <= (extra[m.key] as number) ? 'bg-mindset-pillar' : 'bg-muted')} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setMore(true)} className="self-start text-sm font-medium text-muted-foreground underline underline-offset-[3px]">
          + mood, confidence, motivation, clarity, strength
        </button>
      )}

      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="font-serif text-[18px] font-semibold">Where are you in your cycle?</p>
        <p className="mt-0.5 text-[13px] text-muted-foreground">this moves today&rsquo;s calorie and carb targets.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {CYCLE_PHASES.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPhase(phase === p.key ? null : p.key)}
              className={cn(
                'rounded-full px-3.5 py-2 text-sm font-medium ring-1 transition-colors',
                phase === p.key ? 'bg-mindset-pillar text-white ring-transparent' : 'bg-transparent text-muted-foreground ring-border',
              )}
            >
              {p.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPhase('not_tracked')}
            className={cn(
              'rounded-full px-3.5 py-2 text-sm font-medium ring-1 transition-colors',
              phase === 'not_tracked' ? 'bg-foreground text-background ring-transparent' : 'bg-transparent text-muted-foreground ring-border',
            )}
          >
            don&rsquo;t track
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <label className="font-serif text-[18px] font-semibold" htmlFor="movement">
          Movement today
        </label>
        <div className="mt-2 flex items-center gap-2">
          <input
            id="movement"
            value={movement}
            onChange={(e) => setMovement(e.target.value)}
            inputMode="numeric"
            placeholder="0"
            className="h-12 w-24 rounded-xl bg-background px-3 text-base outline-none ring-1 ring-border focus-visible:ring-2 focus-visible:ring-primary/40"
          />
          <span className="text-sm text-muted-foreground">minutes</span>
        </div>
      </div>

      <button
        type="button"
        onClick={save}
        disabled={pending || (answered === 0 && !phase && !movement)}
        className="flex h-[58px] w-full items-center justify-center gap-2 rounded-2xl bg-primary text-[18px] font-bold text-primary-foreground disabled:opacity-50"
      >
        <Check className="h-5 w-5" />
        {pending ? 'Saving…' : existing ? 'Update today' : 'Log today'}
      </button>
      <p className="text-center text-[12.5px] text-muted-foreground">answer what you feel like answering — partial is fine.</p>
    </div>
  )
}
