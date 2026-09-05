'use client'

import { useState } from 'react'
import { ChevronDown, CircleCheck } from 'lucide-react'
import { WellnessCheckinForm } from '@/components/wellness-checkin-form'
import type { Checkin } from '@/lib/types'
import { cn } from '@/lib/utils'

/**
 * The existing log-today widget, collapsed to a single 44px row so it cannot
 * compete with the day's primary action.
 */
export function LogBlock({ existing }: { existing: Checkin | null }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex h-11 w-full items-center gap-2.5 px-4 text-left"
      >
        {existing ? (
          <CircleCheck className="h-4 w-4 shrink-0 text-mindset-pillar" />
        ) : (
          <span className="h-4 w-4 shrink-0 rounded-full border-[1.5px] border-border" />
        )}
        <span className="flex-1 text-sm font-medium">{existing ? 'Logged today' : 'Log today'}</span>
        <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="border-t border-border p-4">
          <WellnessCheckinForm existing={existing} />
        </div>
      )}
    </div>
  )
}
