'use client'

import { useTransition, useState } from 'react'
import { toast } from 'sonner'
import { Moon, Check, Clock } from 'lucide-react'
import { logRoutineDone } from '@/app/actions'
import type { Tonight } from '@/lib/tonight'
import { Button } from '@/components/ui/button'

/**
 * Tonight, in one card.
 *
 * The routine below it shows everything she owns. This shows the one decision
 * that actually matters this evening — which is the thing people get wrong.
 */
export function TonightCard({ plan, doneToday }: { plan: Tonight; doneToday: boolean }) {
  const [done, setDone] = useState(doneToday)
  const [pending, startTransition] = useTransition()

  function markDone() {
    const previous = done
    setDone(true)
    startTransition(async () => {
      const res = await logRoutineDone(
        plan.kind === 'treatment'
          ? { memberProductId: plan.treatment!.id }
          : { ritualSlug: plan.ritual?.slug },
      )
      if (res?.error) {
        setDone(previous)
        toast.error(res.error)
      }
    })
  }

  const isTreatment = plan.kind === 'treatment'

  return (
    <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Moon className="h-4 w-4" />
        <span className="text-xs font-medium uppercase tracking-[0.12em]">tonight</span>
      </div>

      <p className="mt-3 font-serif text-xl font-semibold text-pretty">
        {isTreatment ? plan.treatment!.name : (plan.ritual?.title ?? 'a gentle night')}
      </p>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground text-pretty">{plan.reason}</p>

      {!isTreatment && plan.ritual && (
        <p className="mt-3 rounded-xl bg-muted p-3 text-sm leading-relaxed text-pretty">{plan.ritual.how}</p>
      )}

      {plan.alongside.length > 0 && (
        <p className="mt-3 text-sm text-muted-foreground text-pretty">
          with your usual {plan.alongside.map((a) => a.name.toLowerCase()).join(', ')}.
        </p>
      )}

      {plan.waiting.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1">
          {plan.waiting.map((w) => (
            <li key={w.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3 shrink-0" />
              {w.name.toLowerCase()} — {w.nightsAway === 1 ? 'tomorrow' : `in ${w.nightsAway} nights`}
            </li>
          ))}
        </ul>
      )}

      <Button
        onClick={markDone}
        disabled={pending || done}
        variant={done ? 'secondary' : 'default'}
        className="mt-4 h-10 w-full rounded-full"
      >
        {done ? (
          <>
            <Check className="mr-1.5 h-4 w-4" />
            done tonight
          </>
        ) : (
          'mark it done'
        )}
      </Button>
    </div>
  )
}
