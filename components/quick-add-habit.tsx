'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { addHabit } from '@/app/actions'

/** Adds a habit without leaving Today. It appears in the list on the next render. */
export function QuickAddHabit() {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function submit() {
    if (!title.trim()) return
    startTransition(async () => {
      const res = await addHabit({ title: title.trim() })
      if (res && 'error' in res && res.error) {
        toast.error(res.error)
        return
      }
      setTitle('')
      setOpen(false)
      router.refresh()
    })
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="-mt-3 flex items-center gap-1.5 self-start text-sm font-medium text-muted-foreground">
        <Plus className="h-4 w-4" /> add something to today&rsquo;s list
      </button>
    )
  }
  return (
    <div className="-mt-3 flex gap-2">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="e.g. 10 minutes outside"
        className="h-11 flex-1 rounded-xl bg-card px-3 text-base outline-none ring-1 ring-border focus-visible:ring-2 focus-visible:ring-primary/40"
      />
      <button type="button" onClick={submit} disabled={pending || !title.trim()} className="h-11 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground disabled:opacity-50">
        Add
      </button>
      <button type="button" onClick={() => setOpen(false)} className="h-11 px-2 text-sm text-muted-foreground">
        Cancel
      </button>
    </div>
  )
}
