'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { setDayPillar } from '@/app/actions'
import { cn } from '@/lib/utils'

const P = ['Body', 'Identity', 'Mindset', 'Faith'] as const

export function DayPillarEditor({ slug, days }: { slug: string; days: { n: number; title: string; week: number; derived: string[]; set: string | null }[] }) {
  const [state, setState] = useState<Record<number, string | null>>(Object.fromEntries(days.map((d) => [d.n, d.set])))
  const [, startTransition] = useTransition()
  function set(n: number, pillar: string | null) {
    setState((s) => ({ ...s, [n]: pillar }))
    startTransition(async () => {
      const res = await setDayPillar(slug, n, pillar)
      if ('error' in res && res.error) toast.error(res.error)
    })
  }
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-border">
      {days.map((d, i) => (
        <div key={d.n} className={cn('flex items-center gap-3 px-3 py-2', i > 0 && 'border-t border-border')}>
          <span className="w-7 shrink-0 text-xs font-bold text-muted-foreground">{d.n}</span>
          <span className="min-w-0 flex-1"><span className="block truncate text-sm">{d.title}</span><span className="block text-[11px] text-muted-foreground">wk {d.week} · reads as {d.derived.join(', ').toLowerCase()}</span></span>
          <div className="flex shrink-0 gap-1">
            {P.map((p) => (
              <button key={p} type="button" onClick={() => set(d.n, state[d.n] === p ? null : p)} title={p} className={cn('h-7 w-7 rounded-full ring-1 ring-border', state[d.n] === p ? 'ring-2 ring-foreground' : 'opacity-60')} style={{ backgroundColor: `var(--pillar-${p.toLowerCase()})` }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
