'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Apple, Leaf, FlaskConical, Clock, Stethoscope, AlertTriangle } from 'lucide-react'
import { saveSkinConcerns } from '@/app/actions'
import {
  CONCERNS, EVIDENCE_LABEL, combine, tensions, acidsToShow, herbsFor, LESS_IS_THE_GOAL,
  HOLISTIC_NOTE, PREGNANCY_NOTE,
} from '@/lib/skin-concerns'
import { CONCERN_LABEL } from '@/lib/apothecary'
import { getActive } from '@/lib/actives'
import { ACID_LIBRARY } from '@/lib/acids'
import { NUTRIENTS } from '@/lib/nutrients'
import { cn } from '@/lib/utils'

/**
 * What she is working on, and what it means from both directions.
 *
 * The structure matters as much as the content. Topical and internal sit
 * side by side rather than internal being a footnote, because the whole
 * premise is that skin is not only a surface — and because the inside half
 * is the part she can act on tonight without buying anything.
 *
 * Two things are load-bearing and should not be quietly dropped later: every
 * internal claim shows how strong the evidence for it is, and every concern
 * says when to stop reading an app and go see somebody. Skin advice that
 * omits the second is how people sit on a changing mole for a year.
 */
export function SkinConcernsPanel({
  initial,
  lifeStage,
}: {
  initial: string[]
  lifeStage?: string | null
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [chosen, setChosen] = useState<string[]>(initial)
  const [open, setOpen] = useState<string | null>(initial[0] ?? null)

  const flagged = lifeStage === 'pregnant' || lifeStage === 'trying' || lifeStage === 'breastfeeding'
  const picked = combine(chosen)
  const conflicts = tensions(chosen)

  function toggle(key: string) {
    const next = chosen.includes(key) ? chosen.filter((k) => k !== key) : [...chosen, key]
    setChosen(next)
    if (!chosen.includes(key)) setOpen(key)
    start(async () => {
      const res = await saveSkinConcerns(next)
      if (res && 'error' in res && res.error) {
        toast.error(res.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="px-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          what you&rsquo;re working on
        </p>
        <p className="mt-1 text-[12.5px] leading-[1.45] text-pretty text-muted-foreground">
          Choose as many as fit. This is how you&rsquo;d describe your own skin, not something
          the app has decided about you.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {CONCERNS.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => toggle(c.key)}
            className={cn(
              'rounded-full px-3 py-1.5 text-[13px] font-medium ring-1 transition-colors',
              chosen.includes(c.key)
                ? 'bg-foreground text-background ring-foreground'
                : 'text-muted-foreground ring-border',
            )}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/*
        Where two choices pull against each other. The genuinely useful thing
        here — left alone, a woman who picks breakouts and redness will do
        both routines at once and make both worse.
      */}
      {conflicts.map((t) => (
        <div key={t} className="flex gap-2.5 rounded-2xl bg-honey/10 p-3.5 ring-1 ring-honey/25">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-honey" />
          <p className="text-[13px] leading-[1.5] text-pretty">{t}</p>
        </div>
      ))}

      {picked.concerns.map((c) => {
        const isOpen = open === c.key
        return (
          <div key={c.key} className="overflow-hidden rounded-3xl bg-card ring-1 ring-border">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : c.key)}
              className="flex w-full flex-col items-start px-4 py-3.5 text-left"
            >
              <span className="font-serif text-[17px] font-semibold">{c.name}</span>
              <span className="mt-0.5 text-[12px] text-muted-foreground">{c.alsoCalled}</span>
            </button>

            {isOpen && (
              <div className="flex flex-col gap-4 border-t border-border px-4 py-4">
                <p className="text-[13.5px] leading-[1.5] text-pretty">{c.what}</p>

                {/* ── On the skin ── */}
                <div>
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <FlaskConical className="h-3.5 w-3.5" />
                    on your skin
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {c.actives.map((k) => {
                      const a = getActive(k)
                      return (
                        <span key={k} className="rounded-full bg-secondary px-2.5 py-1 text-[12px] font-medium">
                          {a?.label ?? k}
                        </span>
                      )
                    })}
                  </div>
                  {/* Azelaic is both an active and an acid — named once, not twice. */}
                  {acidsToShow(c).length > 0 && (
                    <p className="mt-2 text-[12.5px] leading-[1.45] text-pretty text-muted-foreground">
                      Acids worth knowing here:{' '}
                      {acidsToShow(c)
                        .map((k) => ACID_LIBRARY.find((a) => a.key === k)?.name ?? k)
                        .join(', ')}
                      .
                    </p>
                  )}
                </div>

                {/* ── From the inside ── */}
                <div className="rounded-2xl bg-muted/40 p-3">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <Apple className="h-3.5 w-3.5" />
                    from the inside
                    <span className="ml-auto rounded-full bg-card px-2 py-0.5 text-[10.5px] font-medium normal-case tracking-normal">
                      {EVIDENCE_LABEL[c.inside.evidence]}
                    </span>
                  </p>
                  <p className="mt-2 text-[13px] leading-[1.5] text-pretty">{c.inside.why}</p>

                  <p className="mt-2.5 text-[12.5px] leading-[1.45] text-pretty">
                    <span className="font-medium">Foods:</span> {c.inside.foods.join(', ')}.
                  </p>

                  {/*
                    Direction matters. Every nutrient here is something to get
                    enough of except sugar, and a list that shows it beside
                    protein without saying so reads as "eat more sugar".
                  */}
                  {c.inside.nutrients.length > 0 && (
                    <p className="mt-1 text-[12.5px] leading-[1.45] text-pretty text-muted-foreground">
                      Your food log already counts{' '}
                      {c.inside.nutrients
                        .map((k) => {
                          const label = NUTRIENTS.find((n) => n.key === k)?.label ?? k
                          return LESS_IS_THE_GOAL.has(k) ? `${label} (less, here)` : label
                        })
                        .join(', ')}
                      , so this one is checkable rather than a guess.
                      {c.key === 'breakouts' && (
                        <> Sugar is a rough stand-in — it catches fruit and milk sugar and misses
                        the white bread and rice that actually spike blood sugar hardest.</>
                      )}
                    </p>
                  )}

                  {/*
                    The herbs, with the cautions actually attached.

                    This printed the raw key strings and pointed at "the
                    apothecary shelf" for the cautions — a page that does not
                    exist. `herbsFor` was written precisely so those cautions
                    could not be lost, and nothing had ever called it. Several
                    of these carry a pregnancy or blood-thinner flag, so what
                    shipped was a list of herb names with every warning
                    stripped off and a pointer to nowhere.
                  */}
                  {herbsFor(c).length > 0 && (
                    <div className="mt-2 flex items-start gap-1.5 text-[12.5px] leading-[1.45] text-pretty">
                      <Leaf className="mt-0.5 h-3.5 w-3.5 shrink-0 text-honey" />
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">Teas and herbs</span>
                        {herbsFor(c).map((h) => (
                          <span key={h.key}>
                            <span className="font-medium">{h.name}.</span> {h.traditionally}
                            {h.concerns.length > 0 && (
                              <span className="text-honey">
                                {' '}
                                Ask first if you are{' '}
                                {h.concerns.map((x) => CONCERN_LABEL[x]).join(', or ')}.
                                {h.note ? ` ${h.note}` : ''}
                              </span>
                            )}
                          </span>
                        ))}
                        <span className="text-muted-foreground">
                          Traditional use, not treatment. A herb with no flag here has not been
                          cleared for you — it has only not been flagged.
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <p className="text-[13px] leading-[1.5] text-pretty">
                  <span className="font-medium">Watch for:</span> {c.watchFor}
                </p>

                <p className="flex items-start gap-1.5 text-[12.5px] leading-[1.45] text-pretty text-muted-foreground">
                  <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {c.patience}
                </p>

                {/* Never buried. */}
                <p className="flex items-start gap-1.5 rounded-2xl bg-secondary/60 p-3 text-[12.5px] leading-[1.45] text-pretty">
                  <Stethoscope className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>
                    <span className="font-medium">When to see someone: </span>
                    {c.seeSomeone}
                  </span>
                </p>
              </div>
            )}
          </div>
        )
      })}

      {chosen.length > 0 && (
        <>
          {flagged && (
            <p className="rounded-2xl bg-honey/10 p-3.5 text-[12.5px] leading-[1.5] text-pretty ring-1 ring-honey/25">
              {PREGNANCY_NOTE}
            </p>
          )}
          <p className="px-1 text-[11.5px] leading-[1.45] text-pretty text-muted-foreground">
            {HOLISTIC_NOTE}
          </p>
        </>
      )}

      {pending && <p className="px-1 text-[11px] text-muted-foreground">saving…</p>}
    </section>
  )
}
