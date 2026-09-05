'use client'

import { useState } from 'react'
import { saveCourseWriting } from '@/app/actions'
import { cn } from '@/lib/utils'

/** Ten cells, saved on tap. The answer survives a page change. */
export function RateBlock({
  dayNumber,
  promptIndex,
  q,
  left,
  right,
  initialValue,
}: {
  dayNumber: number | null
  promptIndex: number
  q: string
  left?: string
  right?: string
  initialValue: number | null
}) {
  const [value, setValue] = useState<number | null>(initialValue)
  const [savedAt, setSavedAt] = useState<string | null>(initialValue !== null ? 'saved' : null)

  async function pick(n: number) {
    const prev = value
    setValue(n)
    if (dayNumber === null) return
    const res = await saveCourseWriting({ dayNumber, promptIndex, prompt: q, body: String(n), kind: 'rate' })
    if ('error' in res) setValue(prev)
    else setSavedAt(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }))
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="font-serif text-[18px] leading-snug text-pretty">{q}</p>
      <div className="mt-3 grid grid-cols-10 gap-1">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => pick(n)}
            aria-pressed={value === n}
            className={cn(
              'flex h-[42px] items-center justify-center rounded-lg text-[16px] font-bold transition-colors',
              value === n ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
            )}
          >
            {n}
          </button>
        ))}
      </div>
      {(left || right) && (
        <div className="mt-2 flex justify-between gap-3">
          <span className="max-w-[45%] text-xs text-muted-foreground">{left}</span>
          <span className="max-w-[45%] text-right text-xs text-muted-foreground">{right}</span>
        </div>
      )}
      {savedAt && <p className="mt-2 text-xs text-muted-foreground">saved as you tap{savedAt !== 'saved' ? ` · last change ${savedAt}` : ''}</p>}
    </div>
  )
}
