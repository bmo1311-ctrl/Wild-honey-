'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Check, Plus, X } from 'lucide-react'
import { addStudioItem, advanceStudioItem, archiveStudioItem } from '@/app/actions'
import { Celebrate } from '@/components/celebrate'
import { PIPELINE, planBlock, timeLabel, WEEKDAY, weekNotice, type Channel, type StudioBlock, type StudioItem } from '@/lib/studio'
import { cn } from '@/lib/utils'

const CHANNELS: { key: Channel; label: string }[] = [
  { key: 'tiktok', label: 'TikTok' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'newsletter', label: 'Newsletter' },
  { key: 'other', label: 'Other' },
]

/**
 * One block, one thing, one tap.
 *
 * The whole design brief was "nobody is pushing me". A flexible board would
 * hand that problem straight back — so the next block names one piece, says
 * why that one, and advances it with a single press. She is never asked what
 * she feels like doing.
 */
export function StudioBoard({
  blocks,
  items,
  todayWeekday,
  keptBlockIds,
}: {
  blocks: StudioBlock[]
  items: StudioItem[]
  todayWeekday: number
  keptBlockIds: string[]
}) {
  const [pending, startTransition] = useTransition()
  const [burst, setBurst] = useState(0)
  const [adding, setAdding] = useState<Channel | null>(null)
  const [draft, setDraft] = useState('')

  const kept = new Set(keptBlockIds)

  // Today first, then the rest of the week in the order it arrives.
  const ordered = [...blocks].sort(
    (a, b) =>
      ((a.weekday - todayWeekday + 7) % 7) * 1440 + a.startMinute - (((b.weekday - todayWeekday + 7) % 7) * 1440 + b.startMinute),
  )
  const next = ordered[0]
  const plan = next ? planBlock(next, items) : null
  const notice = weekNotice(kept.size, blocks.length)

  function advance(itemId: string, blockId?: string) {
    setBurst((n) => n + 1)
    startTransition(async () => {
      const res = await advanceStudioItem(itemId, blockId ?? null)
      if (res && 'error' in res && res.error) toast.error(res.error)
    })
  }

  function submit(channel: Channel) {
    startTransition(async () => {
      const res = await addStudioItem({ title: draft, channel })
      if (res && 'error' in res && res.error) {
        toast.error(res.error)
        return
      }
      setDraft('')
      setAdding(null)
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <Celebrate show={burst > 0} key={burst} />

      {plan && next && (
        <section className="rounded-3xl bg-card p-5 ring-1 ring-border">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {((next.weekday - todayWeekday + 7) % 7) === 0 ? 'today' : WEEKDAY[next.weekday]} · {timeLabel(next.startMinute)} · {next.label}
          </p>

          {plan.item ? (
            <>
              <p className="mt-2 font-serif text-xl font-semibold text-pretty">{plan.item.title}</p>
              <p className="mt-1 text-sm text-muted-foreground text-pretty">
                {plan.action} — {plan.why}
              </p>
              <button
                type="button"
                onClick={() => advance(plan.item!.id, next.id)}
                disabled={pending}
                className="mt-4 h-[52px] w-full rounded-2xl bg-primary text-[17px] font-bold text-primary-foreground disabled:opacity-60"
              >
                {plan.action}
              </button>
            </>
          ) : (
            <>
              <p className="mt-2 font-serif text-xl font-semibold">nothing waiting</p>
              <p className="mt-1 text-sm text-muted-foreground text-pretty">{plan.why}</p>
              <button
                type="button"
                onClick={() => setAdding(next.channel)}
                className="mt-4 h-[52px] w-full rounded-2xl bg-primary text-[17px] font-bold text-primary-foreground"
              >
                catch an idea
              </button>
            </>
          )}
        </section>
      )}

      {notice && <p className="px-1 text-sm text-muted-foreground">{notice}</p>}

      {ordered.length > 1 && (
        <section>
          <h2 className="mb-2 px-1 font-serif text-[17px] font-semibold">your week</h2>
          <ul className="flex flex-col overflow-hidden rounded-3xl border border-border bg-card">
            {ordered.map((b, i) => (
              <li key={b.id} className={cn('flex items-center gap-3 px-4 py-3', i > 0 && 'border-t border-border')}>
                <span
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px]',
                    kept.has(b.id) ? 'bg-mindset-pillar text-white' : 'border border-border',
                  )}
                >
                  {kept.has(b.id) && <Check className="h-3 w-3" strokeWidth={3} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{b.label}</span>
                  <span className="block text-[12px] text-muted-foreground">
                    {WEEKDAY[b.weekday]} · {timeLabel(b.startMinute)} · {b.minutes} min
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {CHANNELS.map(({ key, label }) => {
        const mine = items.filter((i) => i.channel === key)
        const stages = PIPELINE[key]
        if (mine.length === 0 && adding !== key) {
          return (
            <button
              key={key}
              type="button"
              onClick={() => setAdding(key)}
              className="flex items-center justify-center gap-2 rounded-3xl border border-dashed border-border py-4 text-sm font-medium text-muted-foreground"
            >
              <Plus className="h-4 w-4" /> first {label} idea
            </button>
          )
        }
        return (
          <section key={key}>
            <div className="mb-2 flex items-center justify-between px-1">
              <h2 className="font-serif text-[17px] font-semibold">{label}</h2>
              <button type="button" onClick={() => setAdding(adding === key ? null : key)} className="text-sm text-muted-foreground">
                {adding === key ? 'cancel' : '+ idea'}
              </button>
            </div>

            {adding === key && (
              <div className="mb-2 flex gap-2">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submit(key)}
                  placeholder="what is it?"
                  autoFocus
                  className="h-11 w-full rounded-2xl bg-card px-3 text-base outline-none ring-1 ring-border focus-visible:ring-2 focus-visible:ring-primary/40"
                />
                <button
                  type="button"
                  onClick={() => submit(key)}
                  disabled={pending}
                  className="h-11 shrink-0 rounded-2xl bg-primary px-4 text-sm font-bold text-primary-foreground"
                >
                  add
                </button>
              </div>
            )}

            <ul className="flex flex-col overflow-hidden rounded-3xl border border-border bg-card">
              {mine.map((item, i) => {
                const at = stages.indexOf(item.stage)
                const done = at >= stages.length - 1
                return (
                  <li key={item.id} className={cn('flex items-center gap-3 px-4 py-3', i > 0 && 'border-t border-border')}>
                    <span className="min-w-0 flex-1">
                      <span className={cn('block text-[15px] font-medium', done && 'text-muted-foreground line-through')}>
                        {item.title}
                      </span>
                      <span className="mt-1 flex items-center gap-1">
                        {stages.map((s, si) => (
                          <span
                            key={s}
                            title={s}
                            className={cn('h-1.5 w-6 rounded-full', si <= at ? 'bg-primary' : 'bg-muted')}
                          />
                        ))}
                        <span className="ml-1 text-[11px] text-muted-foreground">{item.stage}</span>
                      </span>
                    </span>
                    {!done ? (
                      <button
                        type="button"
                        onClick={() => advance(item.id)}
                        disabled={pending}
                        className="shrink-0 rounded-full bg-muted px-3 py-1.5 text-[12px] font-semibold"
                      >
                        {planBlock({ ...(next ?? { id: '', label: '', weekday: 0, startMinute: 0, minutes: 0 }), channel: key }, [item]).action}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startTransition(async () => void (await archiveStudioItem(item.id)))}
                        aria-label={`Clear ${item.title}`}
                        className="shrink-0 p-1 text-muted-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
