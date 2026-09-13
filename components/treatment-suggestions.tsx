'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Check, Sparkles } from 'lucide-react'
import { logRoutineDone } from '@/app/actions'
import type { TreatmentSuggestion } from '@/lib/suggestions'
import { cn } from '@/lib/utils'

/**
 * Treatments she can do tonight, with nothing to buy first.
 *
 * The difference between this and the suggestion pickers on Promises: those
 * fill a field and wait. This one *is* the action. Tapping "did this" writes
 * a routine_log row, which is the only evidence this app has ever had about
 * what she actually does to her skin — that table has never held a row,
 * because the only way to write to it was to own products first.
 *
 * Each one shows how to do it. She should never have to leave the card,
 * search a name, or already know what an oat soak is.
 */
export function TreatmentSuggestions({
  suggestions,
  shelfIsEmpty,
}: {
  suggestions: TreatmentSuggestion[]
  shelfIsEmpty: boolean
}) {
  const [pending, start] = useTransition()
  const [done, setDone] = useState<string[]>([])
  const [open, setOpen] = useState<string | null>(suggestions[0]?.slug ?? null)

  if (suggestions.length === 0) return null

  function markDone(slug: string) {
    start(async () => {
      const res = await logRoutineDone({ ritualSlug: slug, slot: 'pm' })
      if (res && 'error' in res && res.error) {
        toast.error(res.error)
        return
      }
      setDone((d) => [...d, slug])
      toast.success('Logged.')
    })
  }

  return (
    <section>
      <p className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        treatments you can do tonight
      </p>
      <div className="flex flex-col gap-2 rounded-3xl bg-card p-4 ring-1 ring-border">
        {shelfIsEmpty && (
          <p className="text-[13px] leading-[1.45] text-pretty text-muted-foreground">
            Nothing on your shelf yet, and none of these need it. Every one is made from
            things that are probably already in your kitchen.
          </p>
        )}

        {suggestions.map((s) => {
          const isDone = done.includes(s.slug)
          const isOpen = open === s.slug
          return (
            <div key={s.slug} className="rounded-2xl ring-1 ring-border">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : s.slug)}
                className="flex w-full items-center gap-3 px-3.5 py-3 text-left"
              >
                <Sparkles className="h-4 w-4 shrink-0 text-honey" />
                <span className="min-w-0 flex-1">
                  <span className={cn('block text-[14.5px] font-medium', isDone && 'text-muted-foreground line-through')}>
                    {s.text}
                  </span>
                  <span className="mt-0.5 block text-[11.5px] text-muted-foreground">
                    {s.minutes} min
                    {s.because ? ` · ${s.because}` : ''}
                  </span>
                </span>
              </button>

              {isOpen && !isDone && (
                <div className="border-t border-border px-3.5 py-3">
                  <p className="text-[13px] leading-[1.5] text-pretty">{s.how}</p>
                  <button
                    type="button"
                    onClick={() => markDone(s.slug)}
                    disabled={pending}
                    className="btn-solid mt-3 flex h-10 items-center justify-center gap-1.5 rounded-xl px-4 text-[13.5px] font-semibold disabled:opacity-50"
                    style={{ '--tone': 'var(--honey-glow)' } as React.CSSProperties}
                  >
                    <Check className="h-4 w-4" />
                    did this
                  </button>
                </div>
              )}
            </div>
          )
        })}

        <p className="px-1 text-[11.5px] leading-[1.45] text-pretty text-muted-foreground">
          Patch test anything new on a small area first, and skip any of these that use
          something you react to.
        </p>
      </div>
    </section>
  )
}
