'use client'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Plus, Check, Trash2 } from 'lucide-react'
import { addGroceryBuilderItem, clearCheckedGroceryItems, deleteGroceryBuilderItem, toggleGroceryItemChecked } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { GroceryBuilderItem } from '@/lib/types'
import { cn } from '@/lib/utils'

export function GroceryBuilder({ items }: { items: GroceryBuilderItem[] }) {
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [pending, startTransition] = useTransition()

  const checkedCount = items.filter((i) => i.checked).length

  function handleAdd() {
    if (!name.trim()) {
      toast.error('Add an item name first.')
      return
    }
    startTransition(async () => {
      const res = await addGroceryBuilderItem({ name, quantity })
      if (res?.error) {
        toast.error(res.error)
        return
      }
      setName('')
      setQuantity('')
    })
  }

  function handleToggle(id: string) {
    startTransition(async () => {
      const res = await toggleGroceryItemChecked(id)
      if (res?.error) toast.error(res.error)
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const res = await deleteGroceryBuilderItem(id)
      if (res?.error) toast.error(res.error)
    })
  }

  function handleClearChecked() {
    startTransition(async () => {
      const res = await clearCheckedGroceryItems()
      if (res?.error) toast.error(res.error)
      else toast.success('Cleared checked items.')
    })
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-card p-5 ring-1 ring-border">
      <div className="flex items-center justify-between">
        <p className="font-serif text-lg font-semibold">my grocery list</p>
        {checkedCount > 0 && (
          <button type="button" onClick={handleClearChecked} className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Trash2 className="h-3 w-3" />
            clear checked
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAdd()
          }}
          placeholder="add an item..."
          className="h-10 flex-1"
        />
        <Input value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="qty" className="h-10 w-20" />
        <Button onClick={handleAdd} disabled={pending} size="icon" className="h-10 w-10 shrink-0">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">nothing on your list yet — add an item above, or import one of the meal-plan grocery lists from Workouts.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {items.map((item) => (
            <div key={item.id} className="group flex items-center gap-2 rounded-lg bg-secondary/40 px-3 py-2">
              <button
                type="button"
                onClick={() => handleToggle(item.id)}
                aria-pressed={item.checked}
                className={cn(
                  'hex-clip flex h-6 w-6 shrink-0 items-center justify-center transition-colors',
                  item.checked ? 'bg-honey text-honey-foreground' : 'bg-background text-muted-foreground ring-1 ring-border',
                )}
              >
                {item.checked && <Check className="h-3.5 w-3.5" />}
              </button>
              <div className={cn('min-w-0 flex-1', item.checked && 'text-muted-foreground line-through')}>
                <span className="text-sm">{item.name}</span>
                {item.quantity && <span className="ml-1.5 text-xs text-muted-foreground">{item.quantity}</span>}
              </div>
              <button type="button" onClick={() => handleDelete(item.id)} className="shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
