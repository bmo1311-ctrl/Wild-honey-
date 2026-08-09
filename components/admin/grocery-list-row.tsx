'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { adminDeleteGroceryList } from '@/app/actions'
import type { GroceryList } from '@/lib/types'

export function GroceryListRow({ groceryList }: { groceryList: GroceryList }) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleDelete() {
    setDeleting(true)
    startTransition(async () => {
      const res = await adminDeleteGroceryList(groceryList.id)
      setDeleting(false)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success('Grocery list deleted.')
    })
  }

  return (
    <div className="flex items-center gap-3 rounded-xl bg-card p-3 ring-1 ring-border">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{groceryList.title}</p>
        <p className="text-xs text-muted-foreground">{groceryList.is_premium ? 'paid' : 'free'}</p>
      </div>
      {confirming ? (
        <div className="flex shrink-0 items-center gap-1.5">
          <button type="button" onClick={handleDelete} disabled={deleting} className="rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
            {deleting ? 'deleting…' : 'confirm delete'}
          </button>
          <button type="button" onClick={() => setConfirming(false)} className="text-xs text-muted-foreground">
            cancel
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setConfirming(true)} className="shrink-0 text-muted-foreground">
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
