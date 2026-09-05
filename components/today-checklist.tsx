'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Check, ChevronRight } from 'lucide-react'
import { completeCourseDay, toggleHabitLog, uncompleteCourseDay } from '@/app/actions'
import { cn } from '@/lib/utils'

export interface TodoRow {
  key: string
  label: string
  hint?: string
  done: boolean
  /** 'course' and 'habit' tick in place; 'link' sends her where the work happens. */
  kind: 'course' | 'habit' | 'link'
  href?: string
  id?: string
}

/** What she needs to do today, in one list, ticked where it can be ticked. */
export function TodayChecklist({ rows }: { rows: TodoRow[] }) {
  const [state, setState] = useState<Record<string, boolean>>(Object.fromEntries(rows.map((r) => [r.key, r.done])))
  const [, startTransition] = useTransition()

  const doneCount = rows.filter((r) => state[r.key]).length

  function toggle(row: TodoRow) {
    const next = !state[row.key]
    setState((s) => ({ ...s, [row.key]: next }))
    startTransition(async () => {
      const res =
        row.kind === 'course'
          ? next
            ? await completeCourseDay(Number(row.id))
            : await uncompleteCourseDay(Number(row.id))
          : await toggleHabitLog(String(row.id))
      if (res && 'error' in res && res.error) {
        setState((s) => ({ ...s, [row.key]: !next }))
        toast.error(res.error)
      }
    })
  }

  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="font-serif text-[19px] font-semibold">What today needs</h2>
        <span className="text-sm text-muted-foreground">
          {doneCount} of {rows.length}
        </span>
      </div>

      <ul className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
        {rows.map((row, i) => {
          const done = state[row.key]
          const inner = (
            <>
              <span
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors',
                  done ? 'bg-mindset-pillar text-white' : 'border-[1.5px] border-border',
                )}
              >
                {done && <Check className="h-4 w-4" strokeWidth={3} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className={cn('block text-[15px] font-medium', done && 'text-muted-foreground line-through')}>{row.label}</span>
                {row.hint && <span className="mt-0.5 block truncate text-[13px] text-muted-foreground">{row.hint}</span>}
              </span>
              {row.kind === 'link' && <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
            </>
          )
          const cls = cn('flex w-full items-center gap-3 px-4 py-4 text-left', i > 0 && 'border-t border-border')
          return (
            <li key={row.key}>
              {row.kind === 'link' ? (
                <Link href={row.href ?? '#'} className={cls}>
                  {inner}
                </Link>
              ) : (
                <button type="button" onClick={() => toggle(row)} className={cls}>
                  {inner}
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
