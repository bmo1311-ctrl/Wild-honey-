'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { ChevronDown, X } from 'lucide-react'
import { addStudioBlock, removeStudioBlock } from '@/app/actions'
import { WEEKDAY, timeLabel, type Channel } from '@/lib/studio'
import { cn } from '@/lib/utils'

const CHANNELS: { key: Channel; label: string }[] = [
  { key: 'tiktok', label: 'TikTok' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'newsletter', label: 'Newsletter' },
  { key: 'other', label: 'Other' },
]

/** Round hours from 5am to 10pm. Enough choice, no time picker. */
const HOURS = Array.from({ length: 18 }, (_, i) => (i + 5) * 60)

/**
 * Setting up the blocks.
 *
 * Folded away by default and sitting below the work, because this is the part
 * she should touch roughly twice a year. Every minute spent arranging the
 * system is a minute not spent filming, which is the exact trap a flexible
 * workspace sets.
 */
export function StudioBlockSetup({
  blocks,
}: {
  blocks: { id: string; label: string; channel: Channel; weekday: number; startMinute: number; minutes: number }[]
}) {
  const [pending, startTransition] = useTransition()
  const [draft, setDraft] = useState({ label: '', channel: 'tiktok' as Channel, weekday: 2, startMinute: 840, minutes: 90 })

  function submit() {
    startTransition(async () => {
      const res = await addStudioBlock(draft)
      if (res && 'error' in res && res.error) {
        toast.error(res.error)
        return
      }
      setDraft({ ...draft, label: '' })
      toast.success('Block added.')
    })
  }

  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 px-1 text-sm text-muted-foreground [&::-webkit-details-marker]:hidden">
        your blocks {blocks.length > 0 && `· ${blocks.length}`}
        <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
      </summary>

      <div className="mt-3 flex flex-col gap-4 rounded-3xl border border-border bg-card p-4">
        {blocks.length > 0 && (
          <ul className="flex flex-col gap-1.5">
            {blocks.map((b) => (
              <li key={b.id} className="flex items-center gap-3 rounded-2xl bg-muted px-3 py-2.5">
                <span className="min-w-0 flex-1 text-sm">
                  <span className="font-medium">{b.label}</span>{' '}
                  <span className="text-muted-foreground">
                    · {WEEKDAY[b.weekday]} {timeLabel(b.startMinute)} · {b.minutes} min
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => startTransition(async () => void (await removeStudioBlock(b.id)))}
                  aria-label={`Remove ${b.label}`}
                  className="shrink-0 p-1 text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-col gap-2.5">
          <input
            value={draft.label}
            onChange={(e) => setDraft({ ...draft, label: e.target.value })}
            placeholder="what is this block for? — TikTok afternoon"
            className="h-11 w-full rounded-2xl bg-background px-3 text-base outline-none ring-1 ring-border focus-visible:ring-2 focus-visible:ring-primary/40"
          />

          <div className="flex flex-wrap gap-1.5">
            {CHANNELS.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setDraft({ ...draft, channel: c.key })}
                className={cn(
                  'rounded-full px-3 py-1.5 text-[13px] font-medium ring-1 transition-colors',
                  draft.channel === c.key ? 'bg-foreground text-background ring-foreground' : 'text-muted-foreground ring-border',
                )}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {WEEKDAY.map((d, i) => (
              <button
                key={d}
                type="button"
                onClick={() => setDraft({ ...draft, weekday: i })}
                className={cn(
                  'rounded-full px-3 py-1.5 text-[13px] font-medium ring-1 transition-colors',
                  draft.weekday === i ? 'bg-foreground text-background ring-foreground' : 'text-muted-foreground ring-border',
                )}
              >
                {d.slice(0, 3)}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <select
              value={draft.startMinute}
              onChange={(e) => setDraft({ ...draft, startMinute: Number(e.target.value) })}
              className="h-11 flex-1 rounded-2xl border border-border bg-background px-3 text-sm"
            >
              {HOURS.map((m) => (
                <option key={m} value={m}>
                  {timeLabel(m)}
                </option>
              ))}
            </select>
            <select
              value={draft.minutes}
              onChange={(e) => setDraft({ ...draft, minutes: Number(e.target.value) })}
              className="h-11 flex-1 rounded-2xl border border-border bg-background px-3 text-sm"
            >
              {[30, 45, 60, 90, 120, 180].map((m) => (
                <option key={m} value={m}>
                  {m} min
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={pending}
            className="h-11 rounded-2xl bg-primary text-[15px] font-bold text-primary-foreground disabled:opacity-60"
          >
            add this block
          </button>
        </div>
      </div>
    </details>
  )
}
