'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { ChevronDown, X } from 'lucide-react'
import { addStudioBlock, removeStudioBlock } from '@/app/actions'
import { REPEATS, SUGGESTED_CHANNELS, WEEKDAY, channelLabel, repeatLabel, timeLabel, type Channel } from '@/lib/studio'

/** Round hours from 5am to 10pm. Enough choice, no time picker. */
const HOURS = Array.from({ length: 18 }, (_, i) => (i + 5) * 60)

const NEW_CHANNEL = '__new__'

const field =
  'h-11 w-full rounded-2xl border border-border bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-primary/40'

/**
 * Setting up the blocks.
 *
 * Folded away below the work, because this is the part she should touch
 * roughly twice a year. Every minute spent arranging the system is a minute
 * not spent filming, which is the exact trap a flexible workspace sets.
 *
 * Two rows of chips became two dropdowns — seven weekday buttons and seven
 * channel buttons filled the panel and made a rarely-used form look like the
 * main event. The space they were taking is now the repeat, which is the
 * thing that was actually missing: not every commitment is weekly.
 */
export function StudioBlockSetup({
  blocks,
}: {
  blocks: {
    id: string
    label: string
    channel: Channel
    weekday: number
    startMinute: number
    minutes: number
    everyNWeeks?: number
  }[]
}) {
  const [pending, startTransition] = useTransition()
  const [newChannel, setNewChannel] = useState(false)
  const [draft, setDraft] = useState({
    label: '',
    channel: 'instagram' as Channel,
    weekday: 2,
    startMinute: 840,
    minutes: 90,
    everyNWeeks: 1,
  })

  // Her own channels first, then the suggestions she has not used yet.
  const mine = [...new Set(blocks.map((b) => b.channel.trim().toLowerCase()))]
  const options = [...new Set([...mine, ...SUGGESTED_CHANNELS])]

  function submit() {
    startTransition(async () => {
      const res = await addStudioBlock(draft)
      if (res && 'error' in res && res.error) {
        toast.error(res.error)
        return
      }
      setDraft({ ...draft, label: '' })
      setNewChannel(false)
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
                  <span className="font-medium">{b.label}</span>
                  <span className="mt-0.5 block text-[12px] text-muted-foreground">
                    {WEEKDAY[b.weekday]} · {timeLabel(b.startMinute)} · {b.minutes} min ·{' '}
                    {repeatLabel(b.everyNWeeks ?? 1)}
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
            placeholder="what is this block for? — Instagram afternoon"
            className={field}
          />

          {newChannel ? (
            <input
              value={draft.channel}
              onChange={(e) => setDraft({ ...draft, channel: e.target.value })}
              placeholder="name the channel"
              autoFocus
              className={field}
            />
          ) : (
            <select
              value={draft.channel.trim().toLowerCase()}
              onChange={(e) => {
                if (e.target.value === NEW_CHANNEL) {
                  setNewChannel(true)
                  setDraft({ ...draft, channel: '' })
                  return
                }
                setDraft({ ...draft, channel: e.target.value })
              }}
              className={field}
            >
              {options.map((c) => (
                <option key={c} value={c}>
                  {channelLabel(c)}
                </option>
              ))}
              <option value={NEW_CHANNEL}>something else…</option>
            </select>
          )}

          <div className="flex gap-2">
            <select
              value={draft.weekday}
              onChange={(e) => setDraft({ ...draft, weekday: Number(e.target.value) })}
              className={field}
            >
              {WEEKDAY.map((d, i) => (
                <option key={d} value={i}>
                  {d}
                </option>
              ))}
            </select>
            <select
              value={draft.startMinute}
              onChange={(e) => setDraft({ ...draft, startMinute: Number(e.target.value) })}
              className={field}
            >
              {HOURS.map((m) => (
                <option key={m} value={m}>
                  {timeLabel(m)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <select
              value={draft.minutes}
              onChange={(e) => setDraft({ ...draft, minutes: Number(e.target.value) })}
              className={field}
            >
              {[30, 45, 60, 90, 120, 180].map((m) => (
                <option key={m} value={m}>
                  {m} min
                </option>
              ))}
            </select>
            <select
              value={draft.everyNWeeks}
              onChange={(e) => setDraft({ ...draft, everyNWeeks: Number(e.target.value) })}
              className={field}
            >
              {REPEATS.map((r) => (
                <option key={r.weeks} value={r.weeks}>
                  {r.label}
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
