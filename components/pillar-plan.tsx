'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { ChevronDown, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { savePillarIntention } from '@/app/actions'
import { PILLAR_META } from '@/lib/pillars'
import type { PillarPlan } from '@/lib/shelf'
import { relativeTime } from '@/lib/pillars'
import { cn } from '@/lib/utils'

/**
 * One pillar of her plan.
 *
 * Three parts, in the order a coach would take them: what she said matters
 * here, what is held here, and what she has already written under it.
 *
 * What stood here before was a progress bar — Body as "31 of 56 days", Faith
 * as "week 3 of 12", with the unfilled track standing in for what she was
 * missing. There is no bar now and no total, because a pillar does not have
 * one.
 */
export function PillarPlanCard({ plan }: { plan: PillarPlan }) {
  const meta = PILLAR_META[plan.pillar]
  const colour = `var(--pillar-${plan.pillar.toLowerCase()})`
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(plan.intention ?? '')
  const [saved, setSaved] = useState(plan.intention)
  const [pending, startTransition] = useTransition()
  const [openShelf, setOpenShelf] = useState(false)
  const [openHers, setOpenHers] = useState(false)

  function save() {
    const next = draft.trim()
    startTransition(async () => {
      const res = await savePillarIntention(plan.pillar, next)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      setSaved(next || null)
      setEditing(false)
    })
  }

  const rest = plan.shelf.all.length - plan.shelf.offered.length

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: colour }} aria-hidden="true" />
        <p className="font-serif text-[17px] font-semibold">{meta.label}</p>
        <button
          type="button"
          onClick={() => setEditing((e) => !e)}
          aria-label={saved ? `edit what matters in ${meta.label}` : `say what matters in ${meta.label}`}
          className="ml-auto text-muted-foreground"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* 1. Hers. */}
      {editing ? (
        <div className="mt-3 flex flex-col gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, 280))}
            rows={2}
            autoFocus
            placeholder={`what matters to you here?`}
            className="w-full resize-none rounded-xl bg-secondary/60 p-3 text-[15px] leading-[1.5] outline-none ring-1 ring-border focus-visible:ring-2 focus-visible:ring-primary/40"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={save}
              disabled={pending}
              className="rounded-full bg-foreground px-4 py-1.5 text-xs font-medium text-background disabled:opacity-50"
            >
              save
            </button>
            <button
              type="button"
              onClick={() => {
                setDraft(saved ?? '')
                setEditing(false)
              }}
              className="text-xs font-medium text-muted-foreground"
            >
              cancel
            </button>
            {/* Clearing is allowed and is not framed as giving up. */}
            <span className="ml-auto text-[11px] text-muted-foreground">leave it empty to take it back</span>
          </div>
        </div>
      ) : saved ? (
        <p className="mt-2.5 border-l-2 pl-3 text-[15px] leading-[1.5] text-pretty" style={{ borderColor: colour }}>
          {saved}
        </p>
      ) : (
        /*
         * An invitation, not an empty field.
         *
         * The pillar description is Brooke's line about what this pillar is
         * for, which is the right thing to read when she has not written her
         * own yet — and a great deal better than a blank box with a label.
         */
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-2 block text-left text-[13.5px] leading-[1.45] text-pretty text-muted-foreground"
        >
          {meta.description} <span className="underline underline-offset-[3px]">say what it means to you</span>
        </button>
      )}

      {/* 2. What is held here. */}
      {plan.shelf.offered.length > 0 && (
        <ul className="mt-3.5 flex flex-col gap-2">
          {plan.shelf.offered.map((o) => (
            <li key={o.id}>
              <Link href={o.href ?? '/app/vault'} className="flex items-start gap-2">
                <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full" style={{ backgroundColor: colour }} aria-hidden="true" />
                <span className="flex-1">
                  <span className="block text-[14.5px] leading-[1.5] text-pretty">{o.text}</span>
                  {o.note && (
                    <span className="mt-0.5 block text-[13px] leading-[1.45] text-pretty text-muted-foreground">{o.note}</span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
        {rest > 0 && (
          <button
            type="button"
            onClick={() => setOpenShelf((o) => !o)}
            aria-expanded={openShelf}
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground"
          >
            {openShelf ? 'less' : `${rest} more here`}
            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', openShelf && 'rotate-180')} />
          </button>
        )}

        {/* 3. Her own words, handed back. */}
        {plan.hers.length > 0 && (
          <button
            type="button"
            onClick={() => setOpenHers((o) => !o)}
            aria-expanded={openHers}
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground"
          >
            {openHers ? 'less' : `what you've written here`}
            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', openHers && 'rotate-180')} />
          </button>
        )}
      </div>

      {openShelf && rest > 0 && (
        <ul className="mt-2 flex flex-col gap-2">
          {plan.shelf.all
            .filter((a) => !plan.shelf.offered.some((o) => o.id === a.id))
            .map((o) => (
              <li key={o.id}>
                <Link href={o.href ?? '/app/vault'} className="flex items-start gap-2">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full" style={{ backgroundColor: colour }} aria-hidden="true" />
                  <span className="flex-1 text-[14.5px] leading-[1.5] text-pretty">{o.text}</span>
                </Link>
              </li>
            ))}
        </ul>
      )}

      {openHers && (
        <ul className="mt-2 flex flex-col gap-2.5">
          {plan.hers.map((w) => (
            <li key={w.id} className="rounded-xl bg-secondary/50 p-3">
              {w.prompt && <p className="text-[12.5px] italic text-muted-foreground text-pretty">{w.prompt}</p>}
              <p className="mt-1 whitespace-pre-wrap text-[14.5px] leading-[1.5] text-pretty">{w.body}</p>
              <p className="mt-1.5 text-[11.5px] text-muted-foreground">{relativeTime(w.when)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
