'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Droplets, Search, Star } from 'lucide-react'
import { logFoods } from '@/app/actions'
import { cn } from '@/lib/utils'

export interface KidFoodItem {
  id: string
  name: string
  serving_size: number
  serving_unit: string
}

/**
 * A child's food screen. No numbers she could turn into a worry — just what
 * she ate, a glass of water she can tap, and a star for each one. The rows
 * land in the same log her parent sees, with every nutrient attached.
 */
export function KidFood({
  usual,
  foods,
  water,
  glasses,
  today,
}: {
  usual: { food: KidFoodItem; quantity: number }[]
  foods: KidFoodItem[]
  water: KidFoodItem | null
  glasses: number
  today: string[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [q, setQ] = useState('')
  const [justDid, setJustDid] = useState<string | null>(null)

  const matches = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (s.length < 2) return []
    return foods.filter((f) => f.name.toLowerCase().includes(s)).slice(0, 8)
  }, [q, foods])

  function log(food: KidFoodItem, quantity: number, label: string) {
    setJustDid(food.id)
    startTransition(async () => {
      const res = await logFoods([{ foodItemId: food.id, quantity }])
      if ('error' in res && res.error) {
        toast.error(res.error)
        setJustDid(null)
        return
      }
      toast.success(label)
      setQ('')
      router.refresh()
      setTimeout(() => setJustDid(null), 800)
    })
  }

  const chip = 'flex min-h-[56px] items-center justify-center rounded-2xl px-4 text-center text-[16px] font-semibold transition-transform active:scale-95 disabled:opacity-60'

  return (
    <div className="flex flex-col gap-6">
      {water && (
        <button
          type="button"
          disabled={pending}
          onClick={() => log(water, water.serving_size, 'Glass of water — nice!')}
          className="flex items-center gap-4 rounded-2xl bg-icy-blue-tint p-4 text-left ring-1 ring-icy-blue-line active:scale-[0.98]"
        >
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-card">
            <Droplets className="h-7 w-7 text-icy-blue" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[19px] font-bold">I drank a glass of water</span>
            <span className="block text-[14px] text-muted-foreground">{glasses === 0 ? 'none yet today — tap when you do' : `${glasses} today`}</span>
          </span>
          <span className="flex gap-0.5">
            {Array.from({ length: Math.min(glasses, 6) }).map((_, i) => (
              <Droplets key={i} className="h-4 w-4 fill-current text-icy-blue" />
            ))}
          </span>
        </button>
      )}

      {usual.length > 0 && (
        <section>
          <h2 className="mb-2 text-[13px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Things you eat a lot</h2>
          <div className="grid grid-cols-2 gap-2">
            {usual.map(({ food, quantity }) => (
              <button
                key={food.id}
                type="button"
                disabled={pending}
                onClick={() => log(food, quantity, `${food.name} — logged!`)}
                className={cn(chip, justDid === food.id ? 'bg-primary text-primary-foreground' : 'bg-card ring-1 ring-border')}
              >
                {food.name}
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-[13px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Something else</h2>
        <div className="flex h-14 items-center gap-2 rounded-2xl bg-card px-4 ring-1 ring-border focus-within:ring-2 focus-within:ring-primary/50">
          <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="type what you ate, like apple"
            className="h-full w-full bg-transparent text-[17px] outline-none placeholder:text-muted-foreground"
          />
        </div>
        {matches.length > 0 && (
          <div className="mt-2 flex flex-col gap-2">
            {matches.map((f) => (
              <button
                key={f.id}
                type="button"
                disabled={pending}
                onClick={() => log(f, f.serving_size, `${f.name} — logged!`)}
                className="flex min-h-[52px] items-center justify-between rounded-2xl bg-card px-4 text-left text-[16px] font-semibold ring-1 ring-border active:scale-[0.98]"
              >
                <span>{f.name}</span>
                <span className="text-[13px] font-medium text-muted-foreground">tap to add</span>
              </button>
            ))}
          </div>
        )}
        {q.trim().length >= 2 && matches.length === 0 && (
          <p className="mt-2 text-[14px] text-muted-foreground">can&rsquo;t find that one — ask a grown-up to add it.</p>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-[13px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Today</h2>
        {today.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-card p-5 text-center text-[15px] text-muted-foreground">Nothing yet. What did you have for breakfast?</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {today.map((name, i) => (
              <li key={i} className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3 ring-1 ring-border">
                <Star className="h-5 w-5 shrink-0 fill-current text-primary" />
                <span className="text-[16px] font-medium">{name}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
