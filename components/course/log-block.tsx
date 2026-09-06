'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, CircleCheck } from 'lucide-react'
import { QuickCheckin } from '@/components/course/quick-checkin'
import type { Checkin } from '@/lib/types'
import { cn } from '@/lib/utils'

/** What the rest of the app already knows about today, so the course never asks twice. */
export interface TrackedToday {
  proteinG: number
  waterMl: number
  caffeineMg: number
  mealsLogged: number
}

/**
 * One row on a course day. Water and protein come from the food log and are
 * never typed here. Energy, sleep and stress come from the check-in; if she
 * has not done one yet, three taps do it, and the check-in screen sees the
 * same answers. Nothing is asked twice.
 */
export function LogBlock({ existing, tracked }: { existing: Checkin | null; tracked?: TrackedToday | null }) {
  const rated = existing?.energy != null || existing?.sleep_quality != null || existing?.stress != null
  const [open, setOpen] = useState(false)

  const facts: string[] = []
  if (tracked && tracked.mealsLogged > 0) {
    facts.push(`${Math.round(tracked.proteinG)} g protein`)
    if (tracked.waterMl > 0) facts.push(`${Math.round(tracked.waterMl)} ml water`)
  }
  if (rated) facts.push(`energy ${existing?.energy ?? '–'} · sleep ${existing?.sleep_quality ?? '–'} · stress ${existing?.stress ?? '–'}`)
  if (existing?.movement_minutes) facts.push(`${existing.movement_minutes} min moved`)

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex min-h-11 w-full items-center gap-2.5 px-4 py-2.5 text-left"
      >
        {rated ? (
          <CircleCheck className="h-4 w-4 shrink-0 text-mindset-pillar" />
        ) : (
          <span className="h-4 w-4 shrink-0 rounded-full border-[1.5px] border-border" />
        )}
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">{rated ? 'Today, so far' : 'How are you today?'}</span>
          {facts.length > 0 && <span className="block truncate text-xs text-muted-foreground">{facts.join(' · ')}</span>}
        </span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="flex flex-col gap-3 border-t border-border p-4">
          {tracked && tracked.mealsLogged === 0 && (
            <p className="text-xs text-muted-foreground">
              nothing logged yet —{' '}
              <Link href="/app/nutrition/log" className="underline underline-offset-[3px]">
                log what you ate
              </Link>{' '}
              and water and protein show up here on their own.
            </p>
          )}
          <QuickCheckin existing={existing} />
          <Link href="/app/checkin" className="text-xs text-muted-foreground underline underline-offset-[3px]">
            full check-in — mood, cycle, symptoms
          </Link>
        </div>
      )}
    </div>
  )
}
