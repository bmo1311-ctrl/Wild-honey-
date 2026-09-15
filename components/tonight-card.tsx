'use client'

import { useTransition, useState } from 'react'
import { toast } from 'sonner'
import { Moon, Clock, HelpCircle } from 'lucide-react'
import { recordLastUsed } from '@/app/actions'
import type { Tonight } from '@/lib/tonight'

/**
 * Tonight, in one card.
 *
 * The routine below it shows everything she owns. This shows the one decision
 * that actually matters this evening — which is the thing people get wrong.
 */
/**
 * When she last used something, in the words people actually use.
 *
 * Not a date picker. Nobody remembers the date they used a retinoid; they
 * remember "last night" or "sometime last week".
 */
const WHEN = [
  { label: 'tonight', nights: 0 },
  { label: 'last night', nights: 1 },
  { label: 'a few days ago', nights: 4 },
  { label: 'over a week ago', nights: 8 },
]

export function TonightCard({ plan }: { plan: Tonight }) {
  const [pending, startTransition] = useTransition()
  const [asking, setAsking] = useState<string | null>(null)
  const [answered, setAnswered] = useState<Set<string>>(new Set())

  function say(productId: string, nights: number) {
    startTransition(async () => {
      const res = await recordLastUsed(productId, nights)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      setAnswered((prev) => new Set(prev).add(productId))
      setAsking(null)
    })
  }

  const isTreatment = plan.kind === 'treatment'
  const stillUnsure = plan.unsure.filter((u) => !answered.has(u.id))

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

      {/*
        The "mark it done" button is gone.
        
        It was an attendance register: a nightly tick whose only reward was
        tomorrow's suggestion, which she would have got anyway. Ten products
        entered, zero routines ever logged — she paid the expensive setup cost
        and skipped the one-tap one, which is what a missing return looks
        like, not what friction looks like.

        What replaces it is one question, asked once per product instead of
        every night, and only when the answer would actually change what the
        app says. See CONSCIOUSNESS.md: it holds, it does not grade.
      */}
      {stillUnsure.length > 0 && (
        <div className="mt-4 rounded-xl bg-muted/70 p-3">
          {asking ? (
            <>
              <p className="text-sm text-pretty">
                when did you last use{' '}
                <span className="font-medium">
                  {stillUnsure.find((u) => u.id === asking)?.name.toLowerCase()}
                </span>
                ?
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {WHEN.map((w) => (
                  <button
                    key={w.label}
                    type="button"
                    disabled={pending}
                    onClick={() => say(asking, w.nights)}
                    className="rounded-full bg-card px-3 py-1.5 text-xs font-medium ring-1 ring-border disabled:opacity-50"
                  >
                    {w.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setAsking(null)}
                  className="px-2 py-1.5 text-xs text-muted-foreground"
                >
                  not now
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="flex items-start gap-1.5 text-[13px] leading-[1.45] text-pretty text-muted-foreground">
                <HelpCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  {stillUnsure.length === 1
                    ? `I can't space ${stillUnsure[0].name.toLowerCase()} properly without knowing when you last used it.`
                    : `I can't space these properly without knowing when you last used them.`}
                </span>
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {stillUnsure.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setAsking(u.id)}
                    className="rounded-full bg-card px-3 py-1.5 text-xs font-medium ring-1 ring-border"
                  >
                    {u.name.toLowerCase()}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
