'use client'

import { useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Check, Plus, Search, Trash2, X } from 'lucide-react'
import { deleteMealLog, logFood, saveFoodItem } from '@/app/actions'
import type { FoodItem } from '@/lib/types'
import { cn } from '@/lib/utils'

interface LoggedRow {
  id: string
  name: string
  quantity: number | null
  unit: string | null
  calories: number | null
  protein: number | null
}

/**
 * Pick a food, type how much, watch the numbers move. A protein shake is two
 * entries — 300ml of milk and a 30g scoop — and both scale from the serving
 * size on the food, so nothing has to be worked out by hand.
 */
export function FoodLogger({ foods, logged }: { foods: FoodItem[]; logged: LoggedRow[] }) {
  const [q, setQ] = useState('')
  const [picked, setPicked] = useState<FoodItem | null>(null)
  const [amount, setAmount] = useState('')
  const [custom, setCustom] = useState(false)
  const [pending, startTransition] = useTransition()

  const [c, setC] = useState({ name: '', size: '100', unit: 'g', cal: '', pro: '', carb: '', fat: '' })

  const matches = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return foods.slice(0, 8)
    return foods.filter((f) => f.name.toLowerCase().includes(t)).slice(0, 12)
  }, [foods, q])

  // scale the food's per-serving macros by what she actually had
  const scaled = useMemo(() => {
    const qty = Number(amount)
    if (!picked || !(qty > 0) || !(picked.serving_size > 0)) return null
    const f = qty / picked.serving_size
    return {
      factor: f,
      calories: picked.calories * f,
      protein: picked.protein_g * f,
      carbs: picked.carbs_g * f,
      fat: picked.fat_g * f,
    }
  }, [picked, amount])

  function submitPicked() {
    if (!picked || !scaled) return
    startTransition(async () => {
      const res = await logFood({
        foodItemId: picked.id,
        customName: picked.name,
        quantity: Number(amount),
        unit: picked.serving_unit,
        calories: scaled.calories,
        protein: scaled.protein,
        carbs: scaled.carbs,
        fat: scaled.fat,
      })
      if ('error' in res && res.error) {
        toast.error(res.error)
        return
      }
      toast.success(`${picked.name} logged`)
      setPicked(null)
      setAmount('')
      setQ('')
    })
  }

  function submitCustom() {
    const size = Number(c.size)
    if (!c.name.trim()) {
      toast.error('Give it a name first.')
      return
    }
    if (!(size > 0)) {
      toast.error('Set a serving size.')
      return
    }
    startTransition(async () => {
      const saved = await saveFoodItem({
        name: c.name,
        servingSize: size,
        servingUnit: c.unit,
        calories: Number(c.cal) || 0,
        protein: Number(c.pro) || 0,
        carbs: Number(c.carb) || 0,
        fat: Number(c.fat) || 0,
      })
      if ('error' in saved && saved.error) {
        toast.error(saved.error)
        return
      }
      const res = await logFood({
        foodItemId: saved.id,
        customName: c.name,
        quantity: size,
        unit: c.unit,
        calories: Number(c.cal) || 0,
        protein: Number(c.pro) || 0,
        carbs: Number(c.carb) || 0,
        fat: Number(c.fat) || 0,
      })
      if ('error' in res && res.error) {
        toast.error(res.error)
        return
      }
      toast.success(`${c.name} saved and logged`)
      setCustom(false)
      setC({ name: '', size: '100', unit: 'g', cal: '', pro: '', carb: '', fat: '' })
    })
  }

  function remove(id: string) {
    startTransition(async () => {
      const res = await deleteMealLog(id)
      if ('error' in res && res.error) toast.error(res.error)
    })
  }

  const field = 'h-11 w-full rounded-xl bg-background px-3 text-base outline-none ring-1 ring-border focus-visible:ring-2 focus-visible:ring-primary/40'

  return (
    <div className="flex flex-col gap-4">
      {logged.length > 0 && (
        <ul className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
          {logged.map((l, i) => (
            <li key={l.id} className={cn('flex items-center gap-3 px-4 py-3', i > 0 && 'border-t border-border')}>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-medium">{l.name}</span>
                <span className="block text-[12.5px] text-muted-foreground">
                  {l.quantity ?? ''}{l.unit ?? ''} · {Math.round(l.calories ?? 0)} cal · {Math.round(l.protein ?? 0)}g protein
                </span>
              </span>
              <button type="button" onClick={() => remove(l.id)} aria-label={`Remove ${l.name}`} className="p-1.5 text-muted-foreground">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {!custom ? (
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={picked ? picked.name : q}
              onChange={(e) => {
                setQ(e.target.value)
                setPicked(null)
              }}
              placeholder="What did you eat?"
              aria-label="Search foods"
              className={cn(field, 'pl-9')}
            />
            {picked && (
              <button
                type="button"
                onClick={() => {
                  setPicked(null)
                  setAmount('')
                }}
                aria-label="Clear"
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {!picked && (
            <ul className="mt-2 flex flex-col">
              {matches.map((f) => (
                <li key={f.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setPicked(f)
                      setAmount(String(f.serving_size))
                    }}
                    className="flex w-full items-center gap-2 py-2 text-left"
                  >
                    <span className="min-w-0 flex-1 truncate text-[15px]">{f.name}</span>
                    <span className="shrink-0 text-[12.5px] text-muted-foreground">
                      {f.calories} cal / {f.serving_size}{f.serving_unit}
                    </span>
                  </button>
                </li>
              ))}
              <li>
                <button type="button" onClick={() => setCustom(true)} className="flex w-full items-center gap-2 py-2.5 text-left text-[15px] font-medium text-mindset-pillar">
                  <Plus className="h-4 w-4" /> Add a food that isn&rsquo;t here
                </button>
              </li>
            </ul>
          )}

          {picked && (
            <div className="mt-3">
              <label className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
                How much? ({picked.serving_unit})
              </label>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="decimal"
                type="number"
                min="0"
                autoFocus
                className={field}
              />
              <div className="mt-3 grid grid-cols-4 gap-2 rounded-xl bg-muted p-3 text-center">
                {[
                  ['cal', scaled?.calories],
                  ['protein', scaled?.protein],
                  ['carbs', scaled?.carbs],
                  ['fat', scaled?.fat],
                ].map(([label, v]) => (
                  <div key={label as string}>
                    <p className="font-serif text-[19px] font-semibold leading-none">{v == null ? '—' : Math.round(v as number)}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-muted-foreground">{label as string}</p>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={submitPicked}
                disabled={pending || !scaled}
                className="mt-3 flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-primary text-[17px] font-bold text-primary-foreground disabled:opacity-50"
              >
                <Check className="h-5 w-5" /> Log it
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-serif text-[17px] font-semibold">New food</p>
            <button type="button" onClick={() => setCustom(false)} aria-label="Cancel">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          <div className="flex flex-col gap-2.5">
            <input value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} placeholder="Name" className={field} />
            <div className="grid grid-cols-2 gap-2">
              <input value={c.size} onChange={(e) => setC({ ...c, size: e.target.value })} inputMode="decimal" placeholder="Serving size" className={field} />
              <input value={c.unit} onChange={(e) => setC({ ...c, unit: e.target.value })} placeholder="g / ml" className={field} />
            </div>
            <p className="text-xs text-muted-foreground">macros in one serving of that size</p>
            <div className="grid grid-cols-4 gap-2">
              {(['cal', 'pro', 'carb', 'fat'] as const).map((k) => (
                <input
                  key={k}
                  value={c[k]}
                  onChange={(e) => setC({ ...c, [k]: e.target.value })}
                  inputMode="decimal"
                  placeholder={k}
                  className="h-11 w-full rounded-xl bg-background px-2 text-center text-base outline-none ring-1 ring-border focus-visible:ring-2 focus-visible:ring-primary/40"
                />
              ))}
            </div>
            <button
              type="button"
              onClick={submitCustom}
              disabled={pending}
              className="mt-1 h-[52px] w-full rounded-2xl bg-primary text-[17px] font-bold text-primary-foreground disabled:opacity-50"
            >
              Save and log
            </button>
            <p className="text-center text-xs text-muted-foreground">saved to your foods, so it&rsquo;s one tap next time</p>
          </div>
        </div>
      )}
    </div>
  )
}
