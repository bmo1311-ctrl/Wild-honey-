'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Eye, Save } from 'lucide-react'
import Link from 'next/link'
import { saveCourseDay } from '@/app/actions'
import { BlockEditor } from '@/components/admin/block-editor'
import type { Block, DayKind } from '@/lib/courses'
import { cn } from '@/lib/utils'

const KINDS: DayKind[] = ['teaching', 'practice', 'session', 'rest', 'milestone']

/**
 * One day of a course, editable.
 *
 * Saves the whole day at once rather than field by field. Course writing is
 * done in passes — she will change a heading, rewrite two paragraphs and add
 * a photograph in the same sitting — and autosaving each keystroke into
 * something members are reading is the wrong shape for that.
 *
 * The unsaved marker is deliberately obvious for the same reason: the cost
 * of losing a paragraph she rewrote is much higher than the cost of a dot.
 */
export function CourseDayEditor({
  slug,
  dayNumber,
  initial,
}: {
  slug: string
  dayNumber: number
  initial: { title: string; kind: string | null; minutes: number | null; blocks: Block[] }
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [title, setTitle] = useState(initial.title)
  const [kind, setKind] = useState(initial.kind ?? '')
  const [minutes, setMinutes] = useState(initial.minutes?.toString() ?? '')
  const [blocks, setBlocks] = useState<Block[]>(initial.blocks)
  const [dirty, setDirty] = useState(false)

  function touch<T>(set: (v: T) => void) {
    return (v: T) => {
      set(v)
      setDirty(true)
    }
  }

  function save() {
    start(async () => {
      const res = await saveCourseDay(slug, dayNumber, {
        title,
        kind: kind || null,
        minutes: minutes ? Number(minutes) : null,
        blocks,
      })
      if (res && 'error' in res && res.error) {
        toast.error(res.error)
        return
      }
      setDirty(false)
      toast.success('Saved. Members see this now.')
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 rounded-3xl bg-card p-4 ring-1 ring-border">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">title</span>
          <input
            value={title}
            onChange={(e) => touch(setTitle)(e.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          />
        </label>

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">kind</span>
            <div className="flex flex-wrap gap-1.5">
              {KINDS.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => touch(setKind)(kind === k ? '' : k)}
                  className={cn(
                    'rounded-full px-2.5 py-1 text-[12.5px] font-medium ring-1 transition-colors',
                    kind === k ? 'bg-foreground text-background ring-foreground' : 'text-muted-foreground ring-border',
                  )}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">minutes</span>
            <input
              value={minutes}
              onChange={(e) => touch(setMinutes)(e.target.value.replace(/[^0-9]/g, ''))}
              inputMode="numeric"
              className="h-10 w-20 rounded-xl border border-border bg-background px-2.5 text-[14px] outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            />
          </label>
        </div>
      </div>

      <div>
        <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          blocks · {blocks.length}
        </p>
        <BlockEditor
          blocks={blocks}
          onChange={(b) => {
            setBlocks(b)
            setDirty(true)
          }}
        />
      </div>

      {/*
        Sticky, because a fifty-block day is a long scroll and a save button
        at the bottom of it is a save button she will forget.
      */}
      <div className="sticky bottom-2 z-20 flex items-center gap-2 rounded-3xl bg-card/95 p-3 shadow-lg ring-1 ring-border backdrop-blur">
        <span className="flex-1 text-[12.5px] text-muted-foreground">
          {dirty ? 'unsaved changes' : 'everything saved'}
        </span>
        <Link
          href={`/app/program/${slug}/day/${dayNumber}`}
          className="flex h-10 items-center gap-1.5 rounded-xl bg-secondary px-3 text-[13px] font-medium"
        >
          <Eye className="h-4 w-4" />
          view
        </Link>
        <button
          type="button"
          onClick={save}
          disabled={pending || !dirty}
          className="btn-solid flex h-10 items-center gap-1.5 rounded-xl px-4 text-[13.5px] font-semibold disabled:opacity-40"
          style={{ '--tone': 'var(--pillar-mindset)' } as React.CSSProperties}
        >
          <Save className="h-4 w-4" />
          {pending ? 'saving…' : 'save'}
        </button>
      </div>
    </div>
  )
}
