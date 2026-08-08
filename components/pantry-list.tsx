'use client'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Plus, X, AlertCircle } from 'lucide-react'
import { addPantryItem, deletePantryItem, toggleRunningLow } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { PantryCategory, PantryItem } from '@/lib/types'
import { cn } from '@/lib/utils'

const CATEGORIES: { value: PantryCategory; label: string }[] = [
  { value: 'produce', label: 'produce' },
  { value: 'protein', label: 'protein' },
  { value: 'dairy', label: 'dairy' },
  { value: 'grains', label: 'grains' },
  { value: 'pantry', label: 'pantry' },
  { value: 'frozen', label: 'frozen' },
  { value: 'spices', label: 'spices' },
  { value: 'other', label: 'other' },
]

export function PantryList({ items }: { items: PantryItem[] }) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [category, setCategory] = useState<PantryCategory>('other')
  const [pending, startTransition] = useTransition()

  function handleAdd() {
    if (!name.trim()) {
      toast.error('Name the item first.')
      return
    }
    startTransition(async () => {
      const res = await addPantryItem({ name, category, quantity })
      if (res?.error) {
        toast.error(res.error)
        return
      }
      setName('')
      setQuantity('')
      setAdding(false)
      toast.success('Added to pantry.')
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const res = await deletePantryItem(id)
      if (res?.error) toast.error(res.error)
    })
  }

  function handleToggleLow(id: string) {
    startTransition(async () => {
      const res = await toggleRunningLow(id)
      if (res?.error) toast.error(res.error)
    })
  }

  const grouped = CATEGORIES.map((c) => ({ ...c, items: items.filter((i) => i.category === c.value) })).filter((c) => c.items.length > 0)

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-card p-5 ring-1 ring-border">
      <div className="flex items-center justify-between">
        <p className="font-serif text-lg font-semibold">my pantry</p>
        <button type="button" onClick={() => setAdding((a) => !a)} className="flex items-center gap-1 text-xs font-medium text-honey">
          <Plus className="h-3.5 w-3.5" />
          add
        </button>
      </div>

      {adding && (
        <div className="flex flex-col gap-2 rounded-xl bg-secondary/50 p-3">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="item, e.g. chicken thighs" className="h-10" />
          <Input value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="quantity (optional), e.g. 2 lbs" className="h-10" />
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategory(c.value)}
                className={cn(
                  'rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-border transition-colors',
                  category === c.value ? 'bg-foreground text-background ring-foreground' : 'bg-transparent text-muted-foreground',
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
          <Button onClick={handleAdd} disabled={pending} className="h-10 self-start">
            save item
          </Button>
        </div>
      )}

      {grouped.length === 0 && !adding ? (
        <p className="text-sm text-muted-foreground">log what you already have so your grocery list only covers what you need.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {grouped.map((g) => (
            <div key={g.value}>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">{g.label}</p>
              <div className="flex flex-col gap-1.5">
                {g.items.map((item) => (
                  <div key={item.id} className="group flex items-center gap-2 rounded-lg bg-secondary/40 px-3 py-2">
                    <button type="button" onClick={() => handleToggleLow(item.id)} className={cn('shrink-0', item.running_low ? 'text-destructive' : 'text-muted-foreground/40')}>
                      <AlertCircle className="h-3.5 w-3.5" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <span className="text-sm">{item.name}</span>
                      {item.quantity && <span className="ml-1.5 text-xs text-muted-foreground">{item.quantity}</span>}
                    </div>
                    {item.running_low && <span className="shrink-0 text-[0.65rem] font-medium uppercase tracking-wide text-destructive">low</span>}
                    <button type="button" onClick={() => handleDelete(item.id)} className="shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
