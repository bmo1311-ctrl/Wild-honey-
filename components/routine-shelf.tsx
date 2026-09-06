'use client'

import { useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Plus, Sun, Moon, X, AlertTriangle, Info } from 'lucide-react'
import { addBeautyProduct, removeBeautyProduct, setLifeStage } from '@/app/actions'
import { ACTIVES } from '@/lib/actives'
import { buildRoutines, findGaps, type ShelfItem } from '@/lib/routine'
import type { LifeStage } from '@/lib/actives'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const CATEGORIES = [
  'cleanser',
  'toner',
  'essence',
  'exfoliant',
  'serum',
  'treatment',
  'eye',
  'moisturizer',
  'oil',
  'spf',
]

const STAGES: { value: 'none' | 'pregnant' | 'trying' | 'breastfeeding'; label: string }[] = [
  { value: 'none', label: 'not right now' },
  { value: 'pregnant', label: 'pregnant' },
  { value: 'trying', label: 'trying' },
  { value: 'breastfeeding', label: 'breastfeeding' },
]

export function RoutineShelf({
  shelf,
  lifeStage,
}: {
  shelf: ShelfItem[]
  lifeStage: LifeStage
}) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('serum')
  const [picked, setPicked] = useState<string[]>([])
  const [pending, startTransition] = useTransition()

  const { am, pm } = useMemo(() => buildRoutines(shelf, lifeStage), [shelf, lifeStage])
  const gaps = useMemo(() => findGaps(shelf), [shelf])

  function toggleActive(key: string) {
    setPicked((p) => (p.includes(key) ? p.filter((k) => k !== key) : [...p, key]))
  }

  function handleAdd() {
    if (!name.trim()) {
      toast.error('What is it called?')
      return
    }
    startTransition(async () => {
      const res = await addBeautyProduct({ name, category, actives: picked, domain: 'skin' })
      if (res?.error) {
        toast.error(res.error)
        return
      }
      setName('')
      setPicked([])
      setAdding(false)
      toast.success('On your shelf.')
    })
  }

  function handleRemove(id: string) {
    startTransition(async () => {
      const res = await removeBeautyProduct(id)
      if (res?.error) toast.error(res.error)
    })
  }

  function handleStage(value: 'none' | 'pregnant' | 'trying' | 'breastfeeding') {
    startTransition(async () => {
      const res = await setLifeStage(value)
      if (res?.error) toast.error(res.error)
    })
  }

  const cautions = [...am.cautions, ...pm.cautions]

  return (
    <div className="flex flex-col gap-6">
      {shelf.length === 0 ? (
        <p className="text-sm text-muted-foreground text-pretty">
          add what you already use and the order sorts itself out — morning, evening, and what
          shouldn&rsquo;t share a night.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <RoutineColumn title="morning" icon={<Sun className="h-4 w-4" />} steps={am.steps} onRemove={handleRemove} />
          <RoutineColumn title="evening" icon={<Moon className="h-4 w-4" />} steps={pm.steps} onRemove={handleRemove} />
        </div>
      )}

      {cautions.length > 0 && (
        <div className="flex flex-col gap-2">
          {cautions.map((c, i) => (
            <div
              key={i}
              className={`flex gap-2 rounded-2xl p-4 text-sm text-pretty ring-1 ${
                c.level === 'pregnancy' ? 'bg-card ring-honey' : 'bg-muted ring-border'
              }`}
            >
              {c.level === 'pregnancy' ? (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-honey" />
              ) : (
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <span>{c.message}</span>
            </div>
          ))}
        </div>
      )}

      {gaps.length > 0 && (
        <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
          {gaps.map((g) => (
            <li key={g} className="text-pretty">
              {g}
            </li>
          ))}
        </ul>
      )}

      {/* Life stage — optional, private, and only ever used for cautions. */}
      <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
        <Label className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
          anything I should watch for?
        </Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {STAGES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => handleStage(s.value)}
              className={`rounded-full px-3 py-1.5 text-sm ${
                (lifeStage ?? 'none') === s.value ? 'bg-mindset-pillar text-white' : 'bg-muted text-muted-foreground'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[0.7rem] leading-relaxed text-muted-foreground text-pretty">
          only used to flag ingredients worth asking your doctor or midwife about. never shared,
          never shown to anyone else.
        </p>
      </div>

      {adding ? (
        <div className="flex flex-col gap-3 rounded-2xl bg-card p-5 ring-1 ring-border">
          <div className="flex flex-col gap-1.5">
            <Label>what is it?</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. the ordinary niacinamide" className="h-11" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>what kind?</Label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-11 rounded-md border border-input bg-background px-3 text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>what&rsquo;s in it? (tick any you know)</Label>
            <div className="flex flex-wrap gap-2">
              {ACTIVES.map((a) => (
                <button
                  key={a.key}
                  type="button"
                  onClick={() => toggleActive(a.key)}
                  className={`rounded-full px-3 py-1.5 text-xs ${
                    picked.includes(a.key) ? 'bg-mindset-pillar text-white' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
            <p className="text-[0.7rem] text-muted-foreground">leave it blank if you&rsquo;re not sure — it still goes in the right place.</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAdd} disabled={pending} className="h-10 flex-1">
              {pending ? 'adding…' : 'add it'}
            </Button>
            <Button variant="ghost" onClick={() => setAdding(false)} className="h-10">
              cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button onClick={() => setAdding(true)} variant="outline" className="self-start rounded-full">
          <Plus className="mr-1.5 h-4 w-4" />
          add a product
        </Button>
      )}
    </div>
  )
}

function RoutineColumn({
  title,
  icon,
  steps,
  onRemove,
}: {
  title: string
  icon: React.ReactNode
  steps: { id: string; name: string; category: string | null; cadence?: string }[]
  onRemove: (id: string) => void
}) {
  return (
    <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium uppercase tracking-[0.12em]">{title}</span>
      </div>
      {steps.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">nothing here yet.</p>
      ) : (
        <ol className="mt-3 flex flex-col gap-2.5">
          {steps.map((s, i) => (
            <li key={s.id} className="flex items-start gap-2.5">
              <span className="mt-0.5 w-4 shrink-0 text-xs text-muted-foreground">{i + 1}</span>
              <span className="flex-1 text-pretty">
                <span className="text-[15px]">{s.name}</span>
                {s.cadence && <span className="block text-xs text-honey">{s.cadence}</span>}
                {s.category && !s.cadence && (
                  <span className="block text-xs text-muted-foreground">{s.category}</span>
                )}
              </span>
              <button
                type="button"
                onClick={() => onRemove(s.id)}
                aria-label={`remove ${s.name}`}
                className="shrink-0 text-muted-foreground/50 hover:text-muted-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
