'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { PILLAR_META } from '@/lib/pillars'
import type { Shelf } from '@/lib/shelf'
import { cn } from '@/lib/utils'

/**
 * One pillar, as a place that holds things.
 *
 * What stood here was a progress bar. Body was "31 of 56 days" with a filled
 * track; Faith was "week 3 of 12". A woman's faith drawn as how far through a
 * programme she had got, with the unfilled part of the bar sitting there as
 * the amount of faith she was missing.
 *
 * There is no bar now and no total, because a pillar does not have one. What
 * it has is things worth returning to, and one or two of them put in front of
 * her depending on the day she is having.
 */
export function PillarShelf({ shelf }: { shelf: Shelf }) {
  const [open, setOpen] = useState(false)
  const meta = PILLAR_META[shelf.pillar]
  const colour = `var(--pillar-${shelf.pillar.toLowerCase()})`
  const rest = shelf.all.length - shelf.offered.length

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: colour }}
          aria-hidden="true"
        />
        <p className="font-serif text-[17px] font-semibold">{meta.label}</p>
      </div>
      <p className="mt-0.5 text-[13.5px] leading-[1.45] text-pretty text-muted-foreground">
        {meta.description}
      </p>

      {shelf.offered.length === 0 ? (
        /*
         * An empty shelf says what it is rather than showing a zero. Nothing
         * is tagged to this pillar yet — that is a fact about the library,
         * not about her, and the wording keeps it that way.
         */
        <p className="mt-3 text-[14px] leading-[1.5] text-pretty text-muted-foreground">
          nothing filed here yet.
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {shelf.offered.map((o) => (
            <Offer key={o.id} offering={o} colour={colour} />
          ))}
        </ul>
      )}

      {rest > 0 && (
        <>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="mt-3 flex items-center gap-1 text-xs font-medium text-muted-foreground"
          >
            {open ? 'less' : `${rest} more on this shelf`}
            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
          </button>
          {open && (
            <ul className="mt-2 flex flex-col gap-2">
              {shelf.all
                .filter((a) => !shelf.offered.some((o) => o.id === a.id))
                .map((o) => (
                  <Offer key={o.id} offering={o} colour={colour} />
                ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}

function Offer({ offering, colour }: { offering: Shelf['all'][number]; colour: string }) {
  const body = (
    <>
      <span
        className="mt-[7px] h-1 w-1 shrink-0 rounded-full"
        style={{ backgroundColor: colour }}
        aria-hidden="true"
      />
      <span className="flex-1">
        <span className="block text-[14.5px] leading-[1.5] text-pretty">{offering.text}</span>
        {offering.note && (
          <span className="mt-0.5 block text-[13px] leading-[1.45] text-pretty text-muted-foreground">
            {offering.note}
          </span>
        )}
      </span>
    </>
  )

  return (
    <li>
      {offering.href ? (
        <Link href={offering.href} className="flex items-start gap-2">
          {body}
        </Link>
      ) : (
        <span className="flex items-start gap-2">{body}</span>
      )}
    </li>
  )
}
