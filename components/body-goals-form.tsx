'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { saveBodyGoals } from '@/app/actions'
import { ACTIVITY_LEVELS, BODY_GOALS, calculateTargets, lbToKg, type ActivityLevel, type BodyGoal } from '@/lib/goals'
import { cn } from '@/lib/utils'

export function BodyGoalsForm({
  initial,
}: {
  initial: {
    weight: string
    weightUnit: 'lb' | 'kg'
    heightCm: string
    birthYear: string
    activity: ActivityLevel | null
    goal: BodyGoal | null
  }
}) {
  const [f, setF] = useState(initial)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const preview = useMemo(() => {
    const w = Number(f.weight)
    if (!(w > 0)) return null
    return calculateTargets({
      weightKg: f.weightUnit === 'lb' ? lbToKg(w) : w,
      heightCm: Number(f.heightCm) || null,
      birthYear: Number(f.birthYear) || null,
      activity: f.activity,
      goal: f.goal,
    })
  }, [f])

  function save() {
    startTransition(async () => {
      const res = await saveBodyGoals({
        weight: Number(f.weight) || null,
        weightUnit: f.weightUnit,
        heightCm: Number(f.heightCm) || null,
        birthYear: Number(f.birthYear) || null,
        activityLevel: f.activity,
        bodyGoal: f.goal,
      })
      if ('error' in res && res.error) {
        toast.error(res.error)
        return
      }
      toast.success('Targets updated')
      router.push('/app/nutrition/log')
    })
  }

  const field = 'h-12 w-full rounded-xl bg-background px-3 text-base outline-none ring-1 ring-border focus-visible:ring-2 focus-visible:ring-primary/40'
  const label = 'mb-1.5 block text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground'

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl border border-border bg-card p-4">
        <label className={label}>What are you working toward?</label>
        <div className="flex flex-col gap-2">
          {BODY_GOALS.map((g) => (
            <button
              key={g.key}
              type="button"
              onClick={() => setF({ ...f, goal: g.key })}
              className={cn(
                'rounded-xl border p-3 text-left transition-colors',
                f.goal === g.key ? 'border-transparent bg-mindset-pillar text-white' : 'border-border',
              )}
            >
              <span className="block text-[15px] font-semibold">{g.label}</span>
              <span className={cn('block text-[13px]', f.goal === g.key ? 'text-white/80' : 'text-muted-foreground')}>{g.blurb}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <label className={label}>Your weight</label>
        <div className="flex gap-2">
          <input
            value={f.weight}
            onChange={(e) => setF({ ...f, weight: e.target.value })}
            inputMode="decimal"
            placeholder="130"
            className={field}
          />
          <div className="flex shrink-0 overflow-hidden rounded-xl ring-1 ring-border">
            {(['lb', 'kg'] as const).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setF({ ...f, weightUnit: u })}
                className={cn('h-12 px-4 text-sm font-semibold', f.weightUnit === u ? 'bg-mindset-pillar text-white' : 'bg-background text-muted-foreground')}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">optional, but makes the calorie estimate much closer</p>
        <div className="mt-1.5 grid grid-cols-2 gap-2">
          <input value={f.heightCm} onChange={(e) => setF({ ...f, heightCm: e.target.value })} inputMode="decimal" placeholder="height in cm" className={field} />
          <input value={f.birthYear} onChange={(e) => setF({ ...f, birthYear: e.target.value })} inputMode="numeric" placeholder="year born" className={field} />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <label className={label}>How active are you?</label>
        <div className="flex flex-col gap-2">
          {ACTIVITY_LEVELS.map((a) => (
            <button
              key={a.key}
              type="button"
              onClick={() => setF({ ...f, activity: a.key })}
              className={cn(
                'rounded-xl border px-3 py-2.5 text-left text-[15px] transition-colors',
                f.activity === a.key ? 'border-transparent bg-mindset-pillar text-white' : 'border-border',
              )}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {preview && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className={label}>Your daily targets</p>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              ['cal', preview.calories],
              ['protein', preview.protein_g],
              ['carbs', preview.carbs_g],
              ['fat', preview.fat_g],
            ].map(([l, v]) => (
              <div key={l as string} className="rounded-xl bg-muted py-3">
                <p className="font-serif text-[20px] font-semibold leading-none">{v ?? '—'}</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-muted-foreground">{l as string}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[13px] text-muted-foreground">
            water {preview.water_ml ? `${(preview.water_ml / 1000).toFixed(1)}L` : '—'} · {preview.basis.join(' · ')}
          </p>
          <p className="mt-2 text-[12.5px] text-muted-foreground">
            A starting point, not a prescription — adjust as you see how your body responds.
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={save}
        disabled={pending || !f.weight}
        className="h-[58px] w-full rounded-2xl bg-primary text-[18px] font-bold text-primary-foreground disabled:opacity-50"
      >
        {pending ? 'Saving…' : 'Save my targets'}
      </button>
    </div>
  )
}
