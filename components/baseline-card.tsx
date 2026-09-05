'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { ChevronDown, X } from 'lucide-react'
import { addVitalityCheckin } from '@/app/actions'
import { VITALITY_DIMENSIONS } from '@/lib/honey-profile'
import { cn } from '@/lib/utils'

/**
 * The "before" snapshot, asked once she is already in the app rather than
 * before she has seen it. Eight things she rates herself — nothing here is
 * measured or scored, it is only what she says today, so that week eight has
 * something honest to compare against.
 */
export function BaselineCardLink({ dayNumber }: { dayNumber: number | null }) {
  return (
    <a href="/app/checkin" className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-border bg-card p-4 text-left">
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold">Mark where you&rsquo;re starting</span>
        <span className="mt-0.5 block text-[13px] text-muted-foreground text-pretty">your first check-in becomes your before{dayNumber ? ` — day ${dayNumber} is early enough` : ''}</span>
      </span>
      <ChevronDown className="h-4 w-4 shrink-0 -rotate-90 text-muted-foreground" />
    </a>
  )
}

export function BaselineCard({ dayNumber }: { dayNumber: number | null }) {
  const [open, setOpen] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [values, setValues] = useState<Record<string, number>>({})
  const [pending, startTransition] = useTransition()

  if (dismissed) return null

  const answered = VITALITY_DIMENSIONS.filter((d) => values[d.key]).length

  function save() {
    startTransition(async () => {
      const res = await addVitalityCheckin(values, undefined, 'baseline')
      if (res && 'error' in res && res.error) {
        toast.error(res.error)
        return
      }
      toast.success('Saved — this is your before.')
      setDismissed(true)
    })
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-border bg-card p-4 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold">Mark where you&rsquo;re starting</span>
          <span className="mt-0.5 block text-[13px] text-muted-foreground text-pretty">
            eight quick ratings{dayNumber ? ` — day ${dayNumber} is early enough for it to count as your before` : ''}
          </span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-1 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-serif text-[19px] font-semibold">Where you&rsquo;re starting</p>
          <p className="mt-0.5 text-[13px] text-muted-foreground text-pretty">
            how it feels today, in your own estimation. no wrong answers, and nothing is shown to anyone.
          </p>
        </div>
        <button type="button" onClick={() => setDismissed(true)} aria-label="Not now" className="shrink-0 p-1">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-3.5">
        {VITALITY_DIMENSIONS.map((d) => (
          <div key={d.key}>
            <div className="mb-1 flex items-baseline justify-between">
              <span className="text-sm font-medium">{d.label}</span>
              <span className="text-xs text-muted-foreground">{values[d.key] ? `${values[d.key]}/10` : '—'}</span>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-label={`${d.label} ${n} out of 10`}
                  onClick={() => setValues((v) => ({ ...v, [d.key]: n }))}
                  className={cn(
                    'h-8 flex-1 rounded-md transition-colors',
                    values[d.key] && n <= values[d.key] ? 'bg-mindset-pillar' : 'bg-muted',
                  )}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={save}
        disabled={pending || answered === 0}
        className="mt-5 h-[52px] w-full rounded-2xl bg-primary text-[17px] font-bold text-primary-foreground disabled:opacity-50"
      >
        {pending ? 'Saving…' : answered === 0 ? 'Rate at least one' : `Save my before (${answered} of ${VITALITY_DIMENSIONS.length})`}
      </button>
    </div>
  )
}
