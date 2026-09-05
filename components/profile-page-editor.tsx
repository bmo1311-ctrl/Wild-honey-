'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { saveProfilePage } from '@/app/actions'
import { cn } from '@/lib/utils'

const SEASONS = [
  { key: 'winter', label: 'Winter', blurb: 'clear, cool, high contrast' },
  { key: 'spring', label: 'Spring', blurb: 'light, warm, fresh' },
  { key: 'summer', label: 'Summer', blurb: 'soft, cool, muted' },
  { key: 'autumn', label: 'Autumn', blurb: 'deep, warm, rich' },
] as const

export function ProfilePageEditor({
  initial,
}: {
  initial: { bio: string; show: { recipes: boolean; progress: boolean; wins: boolean }; colorSeason: string | null }
}) {
  const [bio, setBio] = useState(initial.bio)
  const [show, setShow] = useState(initial.show)
  const [season, setSeason] = useState<string | null>(initial.colorSeason)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function save() {
    startTransition(async () => {
      const res = await saveProfilePage({ bio, show, colorSeason: (season as 'winter' | 'spring' | 'summer' | 'autumn' | null) ?? null })
      if ('error' in res && res.error) {
        toast.error(res.error)
        return
      }
      toast.success('Saved')
      router.refresh()
    })
  }

  const toggles: { key: keyof typeof show; label: string; blurb: string }[] = [
    { key: 'recipes', label: 'Recipes I share', blurb: 'only ones you switched on' },
    { key: 'progress', label: 'Course days done', blurb: 'a count, never which days' },
    { key: 'wins', label: 'Recent wins', blurb: 'your last five' },
  ]

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-2xl border border-border bg-card p-4">
        <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">Your page</p>
        <p className="mb-3 text-[13px] text-muted-foreground">what someone sees when they tap your name in the circle. everything is off until you turn it on.</p>
        <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} maxLength={600} placeholder="A line or two about you — or nothing at all." className="w-full rounded-xl bg-background p-3 text-[15px] leading-[1.5] outline-none ring-1 ring-border focus-visible:ring-2 focus-visible:ring-primary/40" />
        <div className="mt-3 flex flex-col gap-2">
          {toggles.map((t) => (
            <button key={t.key} type="button" onClick={() => setShow({ ...show, [t.key]: !show[t.key] })} className={cn('flex items-center justify-between rounded-xl px-3 py-2.5 text-left ring-1 transition-colors', show[t.key] ? 'bg-mindset-pillar text-white ring-transparent' : 'ring-border')}>
              <span className="text-sm font-medium">{t.label}</span>
              <span className={cn('text-xs', show[t.key] ? 'text-white/80' : 'text-muted-foreground')}>{show[t.key] ? 'shown' : t.blurb}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-4">
        <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">Your colours</p>
        <p className="mb-3 text-[13px] text-muted-foreground">the app dresses in the palette that suits you. pick the season you vibe with.</p>
        <div className="grid grid-cols-2 gap-2">
          {SEASONS.map((s) => (
            <button key={s.key} type="button" onClick={() => setSeason(season === s.key ? null : s.key)} data-palette={s.key} className={cn('rounded-xl border p-3 text-left transition-colors', season === s.key ? 'border-primary ring-2 ring-primary/30' : 'border-border')}>
              <span className="mb-1.5 flex gap-1">
                <span className="h-4 w-4 rounded-full bg-primary" />
                <span className="h-4 w-4 rounded-full bg-honey" />
                <span className="h-4 w-4 rounded-full bg-accent" />
              </span>
              <span className="block text-[15px] font-semibold">{s.label}</span>
              <span className="block text-[12px] text-muted-foreground">{s.blurb}</span>
            </button>
          ))}
        </div>
      </section>

      <button type="button" onClick={save} disabled={pending} className="h-[52px] w-full rounded-2xl bg-primary text-[17px] font-bold text-primary-foreground disabled:opacity-50">
        {pending ? 'Saving…' : 'Save'}
      </button>
    </div>
  )
}
