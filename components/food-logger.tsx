'use client'

import { useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Check, Plus, Search, Trash2, X } from 'lucide-react'
import { deleteMealGroup, deleteMealLog, deleteSavedMeal, logFoods, saveFoodItem, saveMeal } from '@/app/actions'
import type { SavedMeal } from '@/lib/data'
import type { FoodItem } from '@/lib/types'
import { cn } from '@/lib/utils'

interface LoggedRow {
  id: string
  groupId?: string | null
  mealName?: string | null
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
export interface UsualFood {
  food: FoodItem
  lastQuantity: number
  unit: string
  timesLogged: number
}

export function FoodLogger({
  foods,
  logged,
  usual,
  members = [],
  memberId = null,
  onSwitchMember,
  savedMeals = [],
}: {
  savedMeals?: SavedMeal[]
  foods: FoodItem[]
  logged: LoggedRow[]
  usual: UsualFood[]
  members?: { id: string; name: string; is_self: boolean }[]
  memberId?: string | null
  onSwitchMember?: (id: string | null) => void
}) {
  const [multi, setMulti] = useState<Record<string, number>>({})
  const [building, setBuilding] = useState(false)
  const [mealName, setMealName] = useState('')
  const [q, setQ] = useState('')
  const [picked, setPicked] = useState<FoodItem | null>(null)
  const [amount, setAmount] = useState('')
  const [custom, setCustom] = useState(false)
  const [pending, startTransition] = useTransition()

  const [c, setC] = useState({ name: '', size: '100', unit: 'g', cal: '', pro: '', carb: '', fat: '', caffeine: '', water: '' })

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
      // logFoods scales the whole nutrient map — vitamins and minerals included — not just the four macros
      const res = await logFoods([{ foodItemId: picked.id, quantity: Number(amount) }], undefined, memberId)
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
        caffeineMg: c.caffeine.trim() === '' ? null : Number(c.caffeine),
        waterMl: c.water.trim() === '' ? null : Number(c.water),
      })
      if ('error' in saved && saved.error) {
        toast.error(saved.error)
        return
      }
      const res = saved.id
        ? await logFoods([{ foodItemId: saved.id, quantity: size }], undefined, memberId)
        : ({ error: 'Saved, but could not log it.' } as { error: string })
      if ('error' in res && res.error) {
        toast.error(res.error)
        return
      }
      toast.success(`${c.name} saved and logged`)
      setCustom(false)
      setC({ name: '', size: '100', unit: 'g', cal: '', pro: '', carb: '', fat: '', caffeine: '', water: '' })
    })
  }

  function quickLog(u: UsualFood) {
    startTransition(async () => {
      const res = await logFoods([{ foodItemId: u.food.id, quantity: u.lastQuantity }], undefined, memberId)
      if ('error' in res && res.error) {
        toast.error(res.error)
        return
      }
      toast.success(`${u.food.name} logged`)
    })
  }

  function toggleMulti(u: UsualFood) {
    setMulti((m) => {
      const next = { ...m }
      if (next[u.food.id]) delete next[u.food.id]
      else next[u.food.id] = u.lastQuantity
      return next
    })
  }

  function logSelected(save = false) {
    const entries = Object.entries(multi).map(([foodItemId, quantity]) => ({ foodItemId, quantity }))
    startTransition(async () => {
      if (save) {
        if (!mealName.trim()) {
          toast.error('Give the meal a name.')
          return
        }
        const saved = await saveMeal({ name: mealName, items: entries, memberId })
        if ('error' in saved && saved.error) {
          toast.error(saved.error)
          return
        }
      }
      const res = await logFoods(entries, undefined, memberId, save ? mealName : null)
      if ('error' in res && res.error) {
        toast.error(res.error)
        return
      }
      toast.success(save ? `${mealName} saved and logged` : `${entries.length} logged as one meal`)
      setMulti({})
      setBuilding(false)
      setMealName('')
    })
  }

  const selectedCount = Object.keys(multi).length

  function remove(id: string) {
    startTransition(async () => {
      const res = await deleteMealLog(id)
      if ('error' in res && res.error) toast.error(res.error)
    })
  }

  const field = 'h-11 w-full rounded-xl bg-background px-3 text-base outline-none ring-1 ring-border focus-visible:ring-2 focus-visible:ring-primary/40'

  return (
    <div className="flex flex-col gap-4">
      {members.length > 1 && onSwitchMember && (
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
          {members.map((m) => {
            const active = m.is_self ? memberId === null : memberId === m.id
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onSwitchMember(m.is_self ? null : m.id)}
                className={cn(
                  'flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition-colors',
                  active ? 'bg-mindset-pillar text-white' : 'bg-muted text-muted-foreground',
                )}
              >
                <span className={cn('flex h-6 w-6 items-center justify-center rounded-full font-serif text-xs', active ? 'bg-white/20' : 'bg-card')}>
                  {m.name.charAt(0).toUpperCase()}
                </span>
                {m.name}
              </button>
            )
          })}
        </div>
      )}

      {usual.length > 0 && (
        <section>
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">Your usual</h2>
            <button type="button" onClick={() => { setBuilding((b) => !b); setMulti({}) }} className={cn('rounded-full px-3 py-1 text-xs font-semibold', building ? 'bg-mindset-pillar text-white' : 'bg-muted text-muted-foreground')}>
              {building ? 'Cancel' : 'Build a meal'}
            </button>
          </div>
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
            {usual.map((u) => {
              const picked = Boolean(multi[u.food.id])
              return (
                <button
                  key={u.food.id}
                  type="button"
                  disabled={pending}
                  onClick={() => (building ? toggleMulti(u) : quickLog(u))}
                  className={cn(
                    'shrink-0 select-none rounded-2xl border px-3.5 py-2.5 text-left transition-colors disabled:opacity-50 [-webkit-touch-callout:none]',
                    picked ? 'border-transparent bg-mindset-pillar text-white' : 'border-border bg-card',
                  )}
                >
                  <span className="block text-[14px] font-semibold">{u.food.name}</span>
                  <span className={cn('block text-[12px]', picked ? 'text-white/80' : 'text-muted-foreground')}>
                    {u.lastQuantity}{u.unit} · {Math.round((u.food.calories * u.lastQuantity) / u.food.serving_size)} cal
                  </span>
                </button>
              )
            })}
          </div>
          {building && (
            <div className="mt-2 flex flex-col gap-2 rounded-2xl border border-border bg-card p-3">
              <p className="text-[13px] text-muted-foreground">{selectedCount === 0 ? 'tap the foods that go in it' : `${selectedCount} in the bowl`}</p>
              <input value={mealName} onChange={(e) => setMealName(e.target.value)} placeholder="name it — Breakfast bowl" className="h-11 w-full rounded-xl bg-background px-3 text-base outline-none ring-1 ring-border focus-visible:ring-2 focus-visible:ring-primary/40" />
              <div className="flex gap-2">
                <button type="button" onClick={() => logSelected(true)} disabled={pending || selectedCount === 0} className="h-11 flex-1 rounded-xl bg-primary text-sm font-bold text-primary-foreground disabled:opacity-50">Save & log</button>
                <button type="button" onClick={() => logSelected(false)} disabled={pending || selectedCount === 0} className="h-11 flex-1 rounded-xl bg-muted text-sm font-semibold disabled:opacity-50">Just log once</button>
              </div>
            </div>
          )}
        </section>
      )}

      {savedMeals.length > 0 && !building && (
        <section>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">Your meals</h2>
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
            {savedMeals.map((m) => (
              <div key={m.id} className="flex shrink-0 items-stretch overflow-hidden rounded-2xl border border-border bg-card">
                <button type="button" disabled={pending} onClick={() => startTransition(async () => { const r = await logFoods(m.items.map((i) => ({ foodItemId: i.food_item_id, quantity: i.quantity })), undefined, memberId, m.name); if ('error' in r && r.error) toast.error(r.error); else toast.success(`${m.name} logged`) })} className="px-3.5 py-2.5 text-left disabled:opacity-50">
                  <span className="block text-[14px] font-semibold">{m.name}</span>
                  <span className="block text-[12px] text-muted-foreground">{m.foods.length} foods · {m.calories} cal · {m.protein}g protein</span>
                </button>
                <button type="button" onClick={() => startTransition(async () => { await deleteSavedMeal(m.id) })} aria-label={`Remove ${m.name}`} className="border-l border-border px-2 text-muted-foreground"><X className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>
        </section>
      )}

      {logged.length > 0 && (
        <ul className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
          {groupLogged(logged).map((g, i) => g.rows.length > 1 || g.mealName ? (
            <li key={g.key} className={cn('px-4 py-3', i > 0 && 'border-t border-border')}>
              <div className="flex items-center gap-3">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold">{g.mealName ?? 'Meal'}</span>
                  <span className="block text-[12.5px] text-muted-foreground">{Math.round(g.calories)} cal · {Math.round(g.protein)}g protein · {g.rows.length} foods</span>
                </span>
                <button type="button" onClick={() => startTransition(async () => { await deleteMealGroup(g.key) })} aria-label={`Remove ${g.mealName ?? 'meal'}`} className="p-1.5 text-muted-foreground"><Trash2 className="h-4 w-4" /></button>
              </div>
              <p className="mt-1 truncate text-[12px] text-muted-foreground">{g.rows.map((r) => r.name).join(' · ')}</p>
            </li>
          ) : (
            g.rows.map((l) => (
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
            ))
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
            <div className="grid grid-cols-2 gap-2">
              <input value={c.caffeine} onChange={(e) => setC({ ...c, caffeine: e.target.value })} inputMode="decimal" placeholder="caffeine mg" className={field} />
              <input value={c.water} onChange={(e) => setC({ ...c, water: e.target.value })} inputMode="decimal" placeholder={c.unit.toLowerCase() === 'ml' ? `water ml (defaults to ${c.size})` : 'water ml'} className={field} />
            </div>
            <p className="text-xs text-muted-foreground">caffeine and water count toward hydration. a drink in ml is treated as water unless you say otherwise.</p>
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

/** Rows logged together become one entry; singles stay singles. Order preserved. */
function groupLogged(rows: LoggedRow[]) {
  const out: { key: string; mealName: string | null; rows: LoggedRow[]; calories: number; protein: number }[] = []
  const idx = new Map<string, number>()
  for (const r of rows) {
    const key = r.groupId ?? r.id
    if (!idx.has(key)) {
      idx.set(key, out.length)
      out.push({ key, mealName: r.mealName ?? null, rows: [], calories: 0, protein: 0 })
    }
    const g = out[idx.get(key)!]
    g.rows.push(r)
    g.calories += r.calories ?? 0
    g.protein += r.protein ?? 0
  }
  return out
}
