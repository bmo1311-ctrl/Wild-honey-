'use client'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Plus, X, AlertCircle, Pencil } from 'lucide-react'
import { addPantryItem, deletePantryItem, toggleRunningLow, updatePantryItem } from '@/app/actions'
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

function EditablePantryItem({ item }: { item: PantryItem }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(item.name)
  const [quantity, setQuantity] = useState(item.quantity ?? '')
  const [pending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      const res = await deletePantryItem(item.id)
      if (res?.error) toast.error(res.error)
    })
  }

  function handleToggleLow() {
    startTransition(async () => {
      const res = await toggleRunningLow(item.id)
      if (res?.error) toast.error(res.error)
    })
  }

  function handleSave() {
    if (!name.trim()) {
      toast.error('Name cannot be empty.')
      return
    }
    startTransition(async () => {
      const res = await updatePantryItem(item.id, { name, quantity })
      if (res?.error) {
        toast.error(res.error)
        return
      }
      setEditing(false)
    })
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-secondary/60 px-3 py-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9 flex-1" placeholder="item name" />
        <Input value={quantity} onChange={(e) => setQuantity(e.target.value)} className="h-9 w-24" placeholder="how much" />
        <Button onClick={handleSave} disabled={pending} size="sm" className="h-9 shrink-0">
          save
        </Button>
        <button type="button" onClick={() => setEditing(false)} className="shrink-0 text-xs text-muted-foreground">
          cancel
        </button>
      </div>
    )
  }

  return (
    <div className="group flex items-center gap-2 rounded-lg bg-secondary/40 px-3 py-2">
      <button type="button" onClick={handleToggleLow} className={cn('shrink-0', item.running_low ? 'text-destructive' : 'text-muted-foreground/40')}>
        <AlertCircle className="h-3.5 w-3.5" />
      </button>
      <button type="button" onClick={() => setEditing(true)} className="min-w-0 flex-1 text-left">
        <span className="text-sm">{item.name}</span>
        <span className={cn('ml-1.5 text-xs', item.quantity ? 'text-muted-foreground' : 'text-muted-foreground/50 italic')}>
          {item.quantity || 'tap to set amount'}
        </span>
      </button>
      {item.running_low && <span className="shrink-0 text-[0.65rem] font-medium uppercase tracking-wide text-destructive">low</span>}
      <button type="button" onClick={() => setEditing(true)} className="shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <button type="button" onClick={handleDelete} className="shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

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
          <Input value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="how much you have, e.g. 2 lbs" className="h-10" />
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
        <p className="text-sm text-muted-foreground">log what you already have so your grocery list only covers what you need — tap any item later to update how much is left.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {grouped.map((g) => (
            <div key={g.value}>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">{g.label}</p>
              <div className="flex flex-col gap-1.5">
                {g.items.map((item) => (
                  <EditablePantryItem key={item.id} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
