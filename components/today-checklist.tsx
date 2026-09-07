'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Check, ChevronDown, ChevronRight } from 'lucide-react'
import { completeCourseDay, toggleHabitLog, uncompleteCourseDay } from '@/app/actions'
import { Celebrate } from '@/components/celebrate'
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
  /** Which course a course row belongs to. Without it every course records against the first. */
  slug?: string
}

/** How many she is shown before the rest folds away. */
const VISIBLE = 3

/**
 * What today needs — three things, then quiet.
 *
 * This used to render every row it was given. A member with five habits met
 * ten items every morning, all styled identically, so nothing read as the
 * thing to do. Three is enough to be a morning; the rest is still one tap
 * down for whoever wants it.
 *
 * There is no "2 of 10" any more either. A fraction against a total she did
 * not set turns a good morning into a failing grade.
 */
export function TodayChecklist({ rows }: { rows: TodoRow[] }) {
  const [state, setState] = useState<Record<string, boolean>>(Object.fromEntries(rows.map((r) => [r.key, r.done])))
  const [burst, setBurst] = useState(0)
  const [, startTransition] = useTransition()

  const doneCount = rows.filter((r) => state[r.key]).length

  // Unfinished first, in the order the modules offered them; finished sink.
  const ordered = [...rows].sort((a, b) => Number(state[a.key]) - Number(state[b.key]))
  const shown = ordered.slice(0, VISIBLE)
  const rest = ordered.slice(VISIBLE)

  function toggle(row: TodoRow) {
    const next = !state[row.key]
    setState((s) => ({ ...s, [row.key]: next }))
    if (next) setBurst((n) => n + 1)
    startTransition(async () => {
      const res =
        row.kind === 'course'
          ? next
            ? await completeCourseDay(Number(row.id), row.slug)
            : await uncompleteCourseDay(Number(row.id), row.slug)
          : await toggleHabitLog(String(row.id))
      if (res && 'error' in res && res.error) {
        setState((s) => ({ ...s, [row.key]: !next }))
        toast.error(res.error)
      }
    })
  }

  function renderRow(row: TodoRow, i: number) {
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
  }

  return (
    <section>
      <Celebrate show={burst > 0} key={burst} />

      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="font-serif text-[19px] font-semibold">What today needs</h2>
        {doneCount > 0 && (
          <span className="text-sm text-muted-foreground">
            {doneCount} done
          </span>
        )}
      </div>

      <ul className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">{shown.map(renderRow)}</ul>

      {rest.length > 0 && (
        <details className="group mt-2">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 px-1 text-sm text-muted-foreground [&::-webkit-details-marker]:hidden">
            anything else · {rest.length}
            <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
          </summary>
          <ul className="mt-2 flex flex-col overflow-hidden rounded-2xl border border-border bg-card">{rest.map(renderRow)}</ul>
        </details>
      )}
    </section>
  )
}
