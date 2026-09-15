'use client'

import { useState, useTransition } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { dismissStateHeadline } from '@/app/actions'
import type { CapacityLevel, Confidence, PersonalState } from '@/lib/personal-state'
import { cn } from '@/lib/utils'

/**
 * What the app currently believes about her — and why.
 *
 * The "why" is not a nicety. Every reading here is the app making a claim
 * about someone's life from a handful of rows, and a claim like that is only
 * fair if she can open it up and disagree with it. So nothing appears without
 * its evidence attached, and anything the engine is not confident about says
 * so in plain words rather than being rounded up into a number.
 *
 * It renders nothing at all until there is something honest to say. An app
 * that announces your capacity on day one has told you about its defaults,
 * not about you.
 */

const CAPACITY_COPY: Record<CapacityLevel, { label: string; note: string }> = {
  stretched: { label: 'stretched', note: 'you are holding a lot right now' },
  available: { label: 'steady', note: 'there is room, without much spare' },
  abundant: { label: 'open', note: 'you have room to take something on' },
}

/** Said out loud, so a thin reading is never mistaken for a firm one. */
const CONFIDENCE_COPY: Record<Confidence, string | null> = {
  none: null,
  low: 'early days — this is a first impression, not a pattern',
  fair: 'based on a couple of weeks',
  good: null, // Nothing to disclaim. Silence is the confident case.
}

function Bar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
      <div className="h-full rounded-full bg-honey" style={{ width: `${Math.max(3, Math.min(100, value))}%` }} />
    </div>
  )
}

function Measure({
  label,
  value,
  note,
}: {
  label: string
  value: number | null
  note: string
}) {
  // A measure with nothing behind it is left blank rather than shown as zero.
  // Zero is a reading; "not yet" is the truth.
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-medium">{label}</p>
        {value === null ? (
          <span className="text-xs text-muted-foreground">not yet</span>
        ) : (
          <span className="text-sm font-semibold tabular-nums">{Math.round(value)}</span>
        )}
      </div>
      {value === null ? (
        <p className="text-xs text-muted-foreground">{note}</p>
      ) : (
        <Bar value={value} />
      )}
    </div>
  )
}

export function StateReading({ state }: { state: PersonalState }) {
  const [open, setOpen] = useState(false)

  if (state.evidence === 'none') return null

  const cap = CAPACITY_COPY[state.capacity.value]
  const capConfident = state.capacity.confidence !== 'none'
  const disclaimer = CONFIDENCE_COPY[state.evidence]

  // Everything the engine used, in one list, so "why this?" answers the whole
  // card rather than one line of it.
  const reasons = [...state.capacity.because, ...state.vitality.because]

  return (
    <section className="flex flex-col gap-4 rounded-3xl bg-card p-5 ring-1 ring-border">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">where you are</p>
        {capConfident ? (
          <>
            <h2 className="font-serif text-xl font-semibold lowercase">{cap.label}</h2>
            <p className="text-sm text-muted-foreground text-pretty">{cap.note}</p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground text-pretty">
            still getting to know you. a few more check-ins and this fills in.
          </p>
        )}
      </div>

      {/*
        One measure, not three.

        "noticing" and "alignment" were both computed from how often she used
        this app — days she wrote here over fourteen, days she opened it over
        fourteen — and then shown to her as scores about her self-awareness
        and her integrity. A woman with a paper journal read 21% on noticing.
        Both are deleted; see CONSCIOUSNESS.md.

        Vitality stays because it is arithmetic on numbers she typed herself,
        and says "not yet" rather than zero when she has not typed any.
      */}
      <div className="grid grid-cols-1 gap-3">
        <Measure label="vitality" value={state.vitality.value} note="check in and this appears" />
      </div>

      {disclaimer && <p className="text-xs text-muted-foreground">{disclaimer}</p>}

      {reasons.length > 0 && (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="flex items-center gap-1 self-start text-xs font-medium text-honey"
          >
            why this?
            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
          </button>
          {open && (
            <ul className="flex flex-col gap-1.5 rounded-2xl bg-secondary/50 p-3">
              {reasons.map((r) => (
                <li key={r} className="text-[13px] text-muted-foreground text-pretty">
                  {r}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  )
}

/**
 * The one sentence worth interrupting her for.
 *
 * Only ever rendered when `headline()` returned something, which it does
 * rarely and on purpose — a message that appears every day is wallpaper, and
 * the whole value of "this is a capacity problem, not a motivation problem"
 * is that she has not been told it before.
 */
export function StateHeadline({ text, because }: { text: string; because: string[] }) {
  const [open, setOpen] = useState(false)
  const [gone, setGone] = useState(false)
  const [, startTransition] = useTransition()

  // Optimistic, because the whole point of dismissing something is that it
  // goes away when you tap it, not a second later.
  if (gone) return null

  return (
    <div className="flex flex-col gap-2 rounded-3xl bg-secondary p-5 ring-1 ring-border">
      <div className="flex items-start justify-between gap-3">
        <p className="font-serif text-lg font-semibold text-pretty text-secondary-foreground">{text}</p>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => {
            setGone(true)
            startTransition(async () => {
              await dismissStateHeadline(text)
            })
          }}
          className="-mr-1 -mt-1 shrink-0 rounded-full p-1.5 text-muted-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {because.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="self-start text-xs font-medium text-honey"
          >
            {open ? 'hide' : 'why this?'}
          </button>
          {open && (
            <ul className="flex flex-col gap-1">
              {because.map((r) => (
                <li key={r} className="text-[13px] text-muted-foreground text-pretty">
                  {r}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
