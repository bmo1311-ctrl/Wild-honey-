'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Check, Plus, X } from 'lucide-react'
import { addStudioItem, advanceStudioItem, archiveStudioItem } from '@/app/actions'
import { Celebrate } from '@/components/celebrate'
import {
  CADENCES,
  channelLabel,
  daysUntil,
  isDue,
  planBlock,
  stagesFor,
  timeLabel,
  repeatLabel,
  verbFor,
  WEEKDAY,
  weekNotice,
  type Cadence,
  type Channel,
  type StudioBlock,
  type StudioItem,
} from '@/lib/studio'
import { cn } from '@/lib/utils'

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
  today,
  keptBlockIds,
}: {
  blocks: StudioBlock[]
  items: StudioItem[]
  todayWeekday: number
  today: string
  keptBlockIds: string[]
}) {
  const [pending, startTransition] = useTransition()
  const [burst, setBurst] = useState(0)
  const [adding, setAdding] = useState<Channel | null>(null)
  const [draft, setDraft] = useState('')
  const [draftCadence, setDraftCadence] = useState<Cadence>('once')
  const [rhythm, setRhythm] = useState<Cadence | 'all'>('all')

  const kept = new Set(keptBlockIds)

  /*
   * Her channels, taken from what she actually has rather than a list I chose.
   * The fixed four were why adding Instagram meant filing it under Other and
   * then watching the section call itself Other — and why channels she has
   * never touched were showing up as empty prompts.
   */
  const channels = [...new Set([...blocks.map((b) => b.channel), ...items.map((i) => i.channel)])].sort()

  // Soonest first. A fortnightly block has to land on the right fortnight,
  // not just the right weekday, or it quietly becomes a weekly one.
  const until = (b: StudioBlock) => daysUntil(b, todayWeekday, today) * 1440 + b.startMinute
  const ordered = [...blocks].sort((a, b) => until(a) - until(b))
  const next = ordered[0]
  const plan = next ? planBlock(next, items, today) : null

  // The rhythm filter narrows the pipelines below, never the next block —
  // the block is the one thing that should never be filtered away.
  const shown = rhythm === 'all' ? items : items.filter((i) => (i.cadence ?? 'once') === rhythm)
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
      const res = await addStudioItem({ title: draft, channel, cadence: draftCadence })
      if (res && 'error' in res && res.error) {
        toast.error(res.error)
        return
      }
      setDraft('')
      setDraftCadence('once')
      setAdding(null)
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <Celebrate show={burst > 0} key={burst} />

      {plan && next && (
        <section className="rounded-3xl bg-card p-5 ring-1 ring-border">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {daysUntil(next, todayWeekday, today) === 0 ? 'today' : WEEKDAY[next.weekday]} · {timeLabel(next.startMinute)} · {next.minutes} min
          </p>

          <p className="mt-1 font-serif text-xl font-semibold text-pretty">{next.label}</p>

          {plan.item ? (
            <>
              <p className="mt-2 text-[15px] font-medium text-pretty">{plan.item.title}</p>
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
              <p className="mt-2 text-[15px] font-medium">nothing in the {channelLabel(next.channel)} pipeline yet</p>
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
                    {(b.everyNWeeks ?? 1) > 1 && ` · ${repeatLabel(b.everyNWeeks ?? 1)}`}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {items.length > 0 && (
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
          {([{ key: 'all', label: 'everything' }, ...CADENCES] as { key: Cadence | 'all'; label: string }[]).map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setRhythm(c.key)}
              className={cn(
                'shrink-0 rounded-full px-3.5 py-2 text-sm font-medium transition-colors',
                rhythm === c.key ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground',
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      {channels.map((key) => {
        const label = channelLabel(key)
        const mine = shown.filter((i) => i.channel === key)
        const stages = stagesFor(key)
        if (mine.length === 0 && rhythm !== 'all') return null

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

            {adding === key && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {CADENCES.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setDraftCadence(c.key)}
                    className={cn(
                      'rounded-full px-3 py-1.5 text-[13px] font-medium ring-1 transition-colors',
                      draftCadence === c.key ? 'bg-foreground text-background ring-foreground' : 'text-muted-foreground ring-border',
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            )}

            {mine.length === 0 ? (
              <p className="rounded-3xl border border-dashed border-border px-4 py-5 text-center text-sm text-muted-foreground">
                nothing in the {label} pipeline yet.
              </p>
            ) : (
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
                          {stages.map((st, si) => (
                            <span key={st} title={st} className={cn('h-1.5 w-6 rounded-full', si <= at ? 'bg-primary' : 'bg-muted')} />
                          ))}
                          <span className="ml-1 text-[11px] text-muted-foreground">
                            {item.stage}
                            {(item.cadence ?? 'once') !== 'once' && ` · ${item.cadence}`}
                            {(item.cadence ?? 'once') !== 'once' && !isDue(item, today) && ' · done for now'}
                          </span>
                        </span>
                      </span>
                      {!done ? (
                        <button
                          type="button"
                          onClick={() => advance(item.id)}
                          disabled={pending}
                          className="shrink-0 rounded-full bg-muted px-3 py-1.5 text-[12px] font-semibold"
                        >
                          {verbFor(item.stage)}
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
            )}
          </section>
        )
      })}

    </div>
  )
}
