import Link from 'next/link'
import { ChevronRight, Check } from 'lucide-react'
import type { Candidate, Moment } from '@/lib/moment'
import { doneLineFor } from '@/lib/moment'

const TONE_VAR: Record<Candidate['tone'], string> = {
  identity: 'var(--pillar-identity)',
  mindset: 'var(--pillar-mindset)',
  body: 'var(--pillar-body)',
  faith: 'var(--pillar-faith)',
  honey: 'var(--honey-glow)',
}

/**
 * This moment, and what is behind it.
 *
 * One thing large enough to be the only thing on the screen, two or three
 * underneath in case it is not the right one, and the rest folded away. The
 * fold matters as much as the card — a woman who opens this at seven in the
 * morning should not be able to see her evening from here.
 */
export function MomentCard({ moment, hour }: { moment: Moment; hour: number }) {
  if (moment.allDone || !moment.now) {
    return (
      <div className="rounded-3xl bg-card p-6 text-center ring-1 ring-border">
        <p className="font-serif text-[19px] font-semibold leading-snug text-balance">
          {moment.allDone ? doneLineFor(hour) : 'nothing needs you this minute.'}
        </p>
      </div>
    )
  }

  const now = moment.now
  const colour = TONE_VAR[now.tone]

  return (
    <div className="flex flex-col gap-2.5">
      <Link
        href={now.href}
        className="closet-tile flex flex-col gap-4 rounded-3xl p-5 ring-1 ring-inset ring-black/5"
        style={{ backgroundColor: `color-mix(in oklch, ${colour}, var(--card) 86%)` }}
      >
        <span>
          <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            right now
          </span>
          <span className="mt-1.5 block font-serif text-[24px] font-semibold leading-[1.15] text-balance">
            {now.label}
          </span>
          {now.detail && (
            <span className="mt-1.5 block text-[13.5px] leading-[1.45] text-pretty text-muted-foreground">
              {now.detail}
            </span>
          )}
        </span>
        <span
          className="flex h-[52px] items-center justify-center gap-1.5 rounded-2xl text-[16px] font-bold text-primary-foreground"
          style={{ backgroundColor: `color-mix(in oklch, ${colour}, var(--ink) 34%)` }}
        >
          {now.action ?? 'Open it'}
          <ChevronRight className="h-4.5 w-4.5" />
        </span>
      </Link>

      {moment.next.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {moment.next.map((c) => (
            <MomentRow key={c.key} c={c} />
          ))}
        </div>
      )}

      {moment.later.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer list-none px-1 py-1.5 text-[13px] text-muted-foreground marker:hidden">
            later today · {moment.later.length}
          </summary>
          <div className="mt-1.5 flex flex-col gap-1.5">
            {moment.later.map((c) => (
              <MomentRow key={c.key} c={c} muted />
            ))}
          </div>
        </details>
      )}
    </div>
  )
}

function MomentRow({ c, muted = false }: { c: Candidate; muted?: boolean }) {
  const colour = TONE_VAR[c.tone]
  return (
    <Link
      href={c.href}
      className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3 ring-1 ring-border"
      style={muted ? { opacity: 0.72 } : undefined}
    >
      {c.done ? (
        <Check className="h-4 w-4 shrink-0 text-muted-foreground" />
      ) : (
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: colour }}
          aria-hidden="true"
        />
      )}
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-[14.5px] font-medium ${c.done ? 'text-muted-foreground line-through' : ''}`}>
          {c.label}
        </span>
        {c.detail && !c.done && (
          <span className="mt-0.5 block truncate text-[12px] text-muted-foreground">{c.detail}</span>
        )}
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  )
}
