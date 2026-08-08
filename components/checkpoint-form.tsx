'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { addVitalityCheckin } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { VITALITY_DIMENSIONS } from '@/lib/honey-profile'
import { cn } from '@/lib/utils'

export function CheckpointForm() {
  const [open, setOpen] = useState(false)
  const [vitality, setVitality] = useState<Record<string, number>>(
    Object.fromEntries(VITALITY_DIMENSIONS.map((d) => [d.key, 5])),
  )
  const [pending, startTransition] = useTransition()

  function handleSubmit() {
    startTransition(async () => {
      const res = await addVitalityCheckin(vitality)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success('Checkpoint saved.')
      setOpen(false)
    })
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl bg-honey/15 p-3 text-center text-sm font-medium text-honey"
      >
        log a new checkpoint
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-card p-5 ring-1 ring-border">
      <p className="font-serif text-lg font-semibold">how are you now?</p>
      {VITALITY_DIMENSIONS.map((d) => (
        <div key={d.key} className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{d.label}</span>
            <span className="text-xs font-medium text-muted-foreground">{vitality[d.key]}/10</span>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setVitality((prev) => ({ ...prev, [d.key]: n }))}
                className={cn('h-6 flex-1 rounded-sm transition-colors', n <= vitality[d.key] ? 'bg-honey' : 'bg-secondary')}
              />
            ))}
          </div>
        </div>
      ))}
      <div className="flex gap-2">
        <Button onClick={handleSubmit} disabled={pending} className="h-11 flex-1">
          {pending ? 'saving…' : 'save checkpoint'}
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)} className="h-11">
          cancel
        </Button>
      </div>
    </div>
  )
}
