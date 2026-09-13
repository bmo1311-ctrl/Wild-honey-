'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { saveCourseMeta } from '@/app/actions'

/** The course's own title and subtitle — what members read on the programme card. */
export function CourseMetaEditor({
  slug,
  title: initialTitle,
  subtitle: initialSubtitle,
}: {
  slug: string
  title: string
  subtitle: string
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [title, setTitle] = useState(initialTitle)
  const [subtitle, setSubtitle] = useState(initialSubtitle)
  const dirty = title !== initialTitle || subtitle !== initialSubtitle

  function save() {
    start(async () => {
      const res = await saveCourseMeta(slug, { title, subtitle })
      if (res && 'error' in res && res.error) {
        toast.error(res.error)
        return
      }
      toast.success('Saved.')
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-3 rounded-3xl bg-card p-4 ring-1 ring-border">
      <label className="flex flex-col gap-1">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">title</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="h-11 w-full rounded-xl border border-border bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">subtitle</span>
        <textarea
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          rows={2}
          className="w-full rounded-xl border border-border bg-background p-2.5 text-[14px] leading-[1.5] outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        />
      </label>
      <button
        type="button"
        onClick={save}
        disabled={pending || !dirty}
        className="btn-solid h-10 self-start rounded-xl px-4 text-[13.5px] font-semibold disabled:opacity-40"
        style={{ '--tone': 'var(--pillar-mindset)' } as React.CSSProperties}
      >
        {pending ? 'saving…' : 'save'}
      </button>
    </div>
  )
}
