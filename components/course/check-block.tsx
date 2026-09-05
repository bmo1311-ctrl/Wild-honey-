'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { saveCourseWriting } from '@/app/actions'
import { cn } from '@/lib/utils'

/** Checklist plus the demonstration. Saves on tap; ticks survive a new phone. */
export function CheckBlock({
  dayNumber,
  slug,
  promptIndex,
  title,
  items,
  demo,
  initialChecked,
}: {
  dayNumber: number | null
  slug: string
  promptIndex: number
  title?: string
  items: string[]
  demo?: string
  initialChecked: number[]
}) {
  const [checked, setChecked] = useState<number[]>(initialChecked)
  const [savedAt, setSavedAt] = useState<string | null>(null)

  async function toggle(i: number) {
    const prev = checked
    const next = checked.includes(i) ? checked.filter((x) => x !== i) : [...checked, i].sort((a, b) => a - b)
    setChecked(next)
    if (dayNumber === null) return
    const res = await saveCourseWriting({
      dayNumber,
      slug,
      promptIndex,
      prompt: title ?? 'check',
      body: JSON.stringify(next),
      kind: 'check',
    })
    if ('error' in res) setChecked(prev)
    else setSavedAt(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }))
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-baseline justify-between gap-3">
        {title && <p className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">{title}</p>}
        <span className="text-xs text-muted-foreground">
          {checked.length} of {items.length}
        </span>
      </div>
      <ul className="mt-3 flex flex-col gap-2.5">
        {items.map((item, i) => {
          const on = checked.includes(i)
          return (
            <li key={i}>
              <button type="button" onClick={() => toggle(i)} aria-pressed={on} className="flex w-full items-start gap-3 text-left">
                <span
                  className={cn(
                    'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors',
                    on ? 'bg-mindset-pillar text-white' : 'border-[1.5px] border-border',
                  )}
                >
                  {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                </span>
                <span className="text-[14.5px] leading-[1.4] text-pretty">{item}</span>
              </button>
            </li>
          )
        })}
      </ul>
      {demo && (
        <div className="mt-4 border-t border-border pt-3">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-primary">The demonstration</p>
          <p className="mt-1.5 text-[14.5px] leading-[1.45] text-pretty text-muted-foreground">{demo}</p>
        </div>
      )}
      {savedAt && <p className="mt-2 text-xs text-muted-foreground">saved as you tap · last change {savedAt}</p>}
    </div>
  )
}
