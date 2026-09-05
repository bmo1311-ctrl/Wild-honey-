'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { logMeasurement } from '@/app/actions'
import { cn } from '@/lib/utils'

/** Weight and a tape measure. Weekly is plenty; a second entry the same day corrects the first. */
export function MeasurementLogger({ unit: initialUnit }: { unit: 'lb' | 'kg' }) {
  const router = useRouter()
  const [unit, setUnit] = useState<'lb' | 'kg'>(initialUnit)
  const [f, setF] = useState({ weight: '', waist: '', hips: '', chest: '', arm: '', thigh: '', note: '' })
  const [more, setMore] = useState(false)
  const [pending, startTransition] = useTransition()
  const field = 'h-12 w-full rounded-xl bg-background px-3 text-base outline-none ring-1 ring-border focus-visible:ring-2 focus-visible:ring-primary/40'

  function save() {
    const n = (v: string) => (v.trim() === '' ? null : Number(v))
    startTransition(async () => {
      const res = await logMeasurement({ weight: n(f.weight), weightUnit: unit, waist: n(f.waist), hips: n(f.hips), chest: n(f.chest), arm: n(f.arm), thigh: n(f.thigh), note: f.note })
      if ('error' in res && res.error) {
        toast.error(res.error)
        return
      }
      toast.success('Logged')
      setF({ weight: '', waist: '', hips: '', chest: '', arm: '', thigh: '', note: '' })
      router.refresh()
    })
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">Today</p>
      <div className="flex gap-2">
        <input value={f.weight} onChange={(e) => setF({ ...f, weight: e.target.value })} inputMode="decimal" placeholder="weight" className={field} autoFocus />
        <div className="flex shrink-0 overflow-hidden rounded-xl ring-1 ring-border">
          {(['lb', 'kg'] as const).map((u) => (
            <button key={u} type="button" onClick={() => setUnit(u)} className={cn('h-12 px-4 text-sm font-semibold', unit === u ? 'bg-mindset-pillar text-white' : 'bg-background text-muted-foreground')}>{u}</button>
          ))}
        </div>
      </div>
      {more ? (
        <div className="mt-2 grid grid-cols-2 gap-2">
          {(['waist', 'hips', 'chest', 'arm', 'thigh'] as const).map((k) => (
            <input key={k} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} inputMode="decimal" placeholder={`${k} cm`} className={field} />
          ))}
          <input value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="note" className={field} />
        </div>
      ) : (
        <button type="button" onClick={() => setMore(true)} className="mt-2 text-sm font-medium text-muted-foreground underline underline-offset-[3px]">+ tape measurements</button>
      )}
      <button type="button" onClick={save} disabled={pending || (!f.weight && !f.waist && !f.hips)} className="mt-3 h-[52px] w-full rounded-2xl bg-primary text-[17px] font-bold text-primary-foreground disabled:opacity-50">
        {pending ? 'Saving…' : 'Log it'}
      </button>
      <p className="mt-2 text-center text-[12px] text-muted-foreground">once a week, same time of day, is enough to see the line move.</p>
    </div>
  )
}
