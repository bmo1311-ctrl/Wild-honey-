'use client'

import { useEffect, useRef, useState } from 'react'
import { saveCourseWriting } from '@/app/actions'

/**
 * Saves as she types, debounced. Never destructive — this replaces a paper
 * workbook, so the only write path is an upsert of her own text.
 */
export function WriteBlock({
  dayNumber,
  slug,
  promptIndex,
  prompt,
  lines = 6,
  initialBody,
}: {
  dayNumber: number | null
  slug: string
  promptIndex: number
  prompt: string
  lines?: number
  initialBody: string
}) {
  const [body, setBody] = useState(initialBody)
  const [savedAt, setSavedAt] = useState<string | null>(initialBody ? 'saved' : null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dirty = useRef(false)

  useEffect(() => {
    if (!dirty.current || dayNumber === null) return
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      const res = await saveCourseWriting({ dayNumber, slug, promptIndex, prompt, body })
      if (!('error' in res)) setSavedAt(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }))
    }, 800)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [body, dayNumber, promptIndex, prompt])

  return (
    <div className="rounded-2xl border border-border border-l-[3px] border-l-primary bg-card p-4">
      <p className="text-xs font-bold uppercase tracking-[0.1em] text-primary">Write</p>
      <p className="mt-2 font-serif text-[17px] leading-snug text-pretty">{prompt}</p>
      <textarea
        value={body}
        rows={lines}
        onChange={(e) => {
          dirty.current = true
          setBody(e.target.value)
        }}
        className="mt-3 w-full rounded-xl bg-background p-3 text-[16.5px] leading-[1.5] outline-none ring-1 ring-border focus-visible:ring-2 focus-visible:ring-primary/40"
      />
      <p className="mt-2 text-xs text-muted-foreground">
        {dayNumber === null ? 'Saving is available on the day itself.' : savedAt ? `Saved as you type · ${savedAt}` : 'Saved as you type'}
      </p>
    </div>
  )
}
