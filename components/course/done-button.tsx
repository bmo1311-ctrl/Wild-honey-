'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Check, Undo2 } from 'lucide-react'
import { completeCourseDay, uncompleteCourseDay } from '@/app/actions'

/**
 * The one primary action on a day. Optimistic, and always reversible —
 * a completed day becomes a quiet row with Undo, never a dead end.
 */
export function DoneButton({
  dayNumber,
  slug,
  initialDone,
  doneAt,
}: {
  dayNumber: number
  slug: string
  initialDone: boolean
  doneAt: string | null
}) {
  const [done, setDone] = useState(initialDone)
  const [at, setAt] = useState<string | null>(doneAt)
  const [, startTransition] = useTransition()

  function time(iso: string | null) {
    return iso ? new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ''
  }

  function mark(next: boolean) {
    setDone(next)
    if (next) setAt(new Date().toISOString())
    startTransition(async () => {
      const res = next ? await completeCourseDay(dayNumber) : await uncompleteCourseDay(dayNumber)
      if ('error' in res && res.error) {
        setDone(!next)
        toast.error(res.error)
      }
    })
  }

  if (done) {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-muted px-4 py-3">
        <Check className="h-4 w-4 shrink-0 text-mindset-pillar" strokeWidth={3} />
        <span className="flex-1 text-sm font-medium">Done{at ? ` at ${time(at)}` : ''}</span>
        <button type="button" onClick={() => mark(false)} className="flex items-center gap-1 text-sm font-semibold text-primary">
          <Undo2 className="h-3.5 w-3.5" />
          Undo
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => mark(true)}
      className="h-[58px] w-full rounded-2xl bg-primary text-[18px] font-bold text-primary-foreground transition-opacity hover:opacity-90 active:translate-y-px"
    >
      Done for today
    </button>
  )
}
