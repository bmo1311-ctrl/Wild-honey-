'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import type { Pillar4 } from '@/lib/courses'
import { cn } from '@/lib/utils'

const ALL: Pillar4[] = ['Body', 'Identity', 'Mindset', 'Faith']

/** Filter a program's days by the pillar they work in. Nothing is hidden by the course; only what she looks at. */
export function PillarFilter({ counts }: { counts: Record<string, number> }) {
  const router = useRouter()
  const params = useSearchParams()
  const active = params.get('pillar')
  function set(p: string | null) {
    const next = new URLSearchParams(params.toString())
    if (p) next.set('pillar', p)
    else next.delete('pillar')
    router.replace(`?${next.toString()}`, { scroll: false })
  }
  return (
    <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
      <button type="button" onClick={() => set(null)} className={cn('shrink-0 rounded-full px-3.5 py-2 text-sm font-medium', !active ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground')}>All days</button>
      {ALL.map((p) => (
        <button key={p} type="button" onClick={() => set(active === p ? null : p)} className={cn('flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium', active === p ? 'text-white' : 'bg-muted text-muted-foreground')} style={active === p ? { backgroundColor: `var(--pillar-${p.toLowerCase()})` } : undefined}>
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: active === p ? 'rgba(255,255,255,.8)' : `var(--pillar-${p.toLowerCase()})` }} />
          {p} <span className="opacity-70">{counts[p] ?? 0}</span>
        </button>
      ))}
    </div>
  )
}
