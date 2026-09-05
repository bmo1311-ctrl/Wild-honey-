'use client'

import { useState } from 'react'
import { FileText, PlayCircle } from 'lucide-react'
import type { Workout } from '@/lib/types'

export function WorkoutCard({ workout: w }: { workout: Workout }) {
  const [open, setOpen] = useState(false)

  return (
    <div id={`w-${w.id}`} className="flex h-full flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-border">
      {w.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={w.image_url} alt="" className="h-36 w-full object-cover" />
      )}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-serif text-base font-semibold leading-snug text-pretty">{w.title}</h3>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {w.body_group && w.body_group !== 'any' && (
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[0.65rem] font-medium capitalize text-secondary-foreground">{w.body_group.replace('_', ' ')}</span>
          )}
          {w.workout_type && w.workout_type !== 'any' && (
            <span className="rounded-full bg-honey/15 px-2 py-0.5 text-[0.65rem] font-medium capitalize text-honey">{w.workout_type}</span>
          )}
        </div>
        {w.description && <p className="text-sm text-muted-foreground text-pretty">{w.description}</p>}

        {open && w.instructions && (
          <p className="whitespace-pre-wrap border-t border-border pt-2 text-sm leading-relaxed text-pretty">{w.instructions}</p>
        )}

        <div className="mt-auto flex flex-wrap gap-2 pt-2">
          {w.video_url && (
            <a
              href={w.video_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground"
            >
              <PlayCircle className="h-3.5 w-3.5" /> watch
            </a>
          )}
          {w.pdf_url && (
            <a
              href={w.pdf_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground"
            >
              <FileText className="h-3.5 w-3.5" /> PDF
            </a>
          )}
          {w.instructions && (
            <button type="button" onClick={() => setOpen((o) => !o)} className="text-xs font-medium text-honey">
              {open ? 'less' : 'details'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
