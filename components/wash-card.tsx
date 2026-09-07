'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Check, Droplets, Wind } from 'lucide-react'
import { logRoutineDone } from '@/app/actions'
import { HAIR_ROLES } from '@/lib/hair'
import type { WashPlan } from '@/lib/wash-day'
import { Button } from '@/components/ui/button'

/**
 * This wash, in order.
 *
 * The shelf below shows everything she owns. This shows the sequence for
 * today — and on the days between, it says so plainly rather than showing
 * her a list she is not meant to act on.
 */
export function WashCard({ plan, doneToday }: { plan: WashPlan; doneToday: boolean }) {
  const [done, setDone] = useState(doneToday)
  const [pending, startTransition] = useTransition()

  function markDone() {
    const previous = done
    setDone(true)
    startTransition(async () => {
      // Every step of the wash gets logged, because the schedule counts uses.
      for (const step of plan.steps) {
        const res = await logRoutineDone({ memberProductId: step.id })
        if (res?.error) {
          setDone(previous)
          toast.error(res.error)
          return
        }
      }
    })
  }

  if (!plan.isWashDay) {
    return (
      <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Wind className="h-4 w-4" />
          <span className="text-xs font-medium uppercase tracking-[0.12em]">between washes</span>
        </div>
        <p className="mt-3 font-serif text-xl font-semibold text-pretty">
          {plan.nextWashIn === 1 ? 'wash tomorrow' : `wash in ${plan.nextWashIn} days`}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground text-pretty">{plan.reason}</p>

        {plan.between.length > 0 && (
          <ul className="mt-3 flex flex-col gap-2">
            {plan.between.map((s) => (
              <li key={s.id} className="rounded-xl bg-muted p-3">
                <p className="text-sm font-medium">{s.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground text-pretty">{s.why}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Droplets className="h-4 w-4" />
        <span className="text-xs font-medium uppercase tracking-[0.12em]">wash day</span>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-pretty">{plan.reason}</p>

      <ol className="mt-4 flex flex-col gap-2">
        {plan.steps.map((s, i) => (
          <li key={s.id} className="flex gap-3 rounded-xl bg-muted p-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-background text-[0.7rem] font-semibold">
              {i + 1}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium text-pretty">{s.name}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground text-pretty">
                {HAIR_ROLES[s.role].label} — {s.why}
              </span>
            </span>
          </li>
        ))}
      </ol>

      <Button
        onClick={markDone}
        disabled={pending || done || plan.steps.length === 0}
        variant={done ? 'secondary' : 'default'}
        className="mt-4 h-10 w-full rounded-full"
      >
        {done ? (
          <>
            <Check className="mr-1.5 h-4 w-4" />
            washed today
          </>
        ) : (
          'mark the wash done'
        )}
      </Button>
    </div>
  )
}
