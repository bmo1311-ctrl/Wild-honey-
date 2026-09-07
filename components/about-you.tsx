'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { saveBodyPreferences } from '@/app/actions'
import { cn } from '@/lib/utils'

const STAGES: { value: 'none' | 'pregnant' | 'trying' | 'breastfeeding'; label: string }[] = [
  { value: 'none', label: 'not right now' },
  { value: 'trying', label: 'trying' },
  { value: 'pregnant', label: 'pregnant' },
  { value: 'breastfeeding', label: 'feeding' },
]

const field =
  'h-11 w-full rounded-2xl border border-border bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-primary/40'

/**
 * The things about her body that other screens need to know.
 *
 * Protocols used to ask "anything to avoid?" on the page, every visit,
 * underneath her products — a permanent question in a place she came to do
 * one quick thing. It is answered once, here, and read everywhere.
 *
 * All of it is optional and none of it is shared. It drives cautions and
 * nothing else: which ingredients to flag, which herbs to raise, which
 * nutrients to surface.
 */
export function AboutYou({
  initial,
}: {
  initial: { lifeStage: string | null; allergies: string; foodsAvoided: string }
}) {
  const [pending, startTransition] = useTransition()
  const [stage, setStage] = useState(initial.lifeStage ?? 'none')
  const [allergies, setAllergies] = useState(initial.allergies)
  const [avoided, setAvoided] = useState(initial.foodsAvoided)

  function save(next?: { stage?: string }) {
    const payload = {
      lifeStage: (next?.stage ?? stage) as 'none' | 'pregnant' | 'trying' | 'breastfeeding',
      allergies,
      foodsAvoided: avoided,
    }
    startTransition(async () => {
      const res = await saveBodyPreferences(payload)
      if (res && 'error' in res && res.error) {
        toast.error(res.error)
        return
      }
      toast.success('Saved.')
    })
  }

  return (
    <section>
      <p className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">about your body</p>
      <div className="flex flex-col gap-4 rounded-3xl bg-card p-4 ring-1 ring-border">
        <div>
          <p className="text-sm font-medium">Where you are</p>
          <p className="mt-0.5 text-[12px] text-muted-foreground text-pretty">
            Changes which ingredients and herbs get flagged, and which nutrients Nourish shows you.
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {STAGES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => {
                  setStage(s.value)
                  save({ stage: s.value })
                }}
                className={cn(
                  'rounded-full px-3 py-1.5 text-[13px] font-medium ring-1 transition-colors',
                  stage === s.value ? 'bg-foreground text-background ring-foreground' : 'text-muted-foreground ring-border',
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium">Allergies</p>
          <p className="mt-0.5 mb-2 text-[12px] text-muted-foreground text-pretty">
            Anything that has ever reacted — foods, plants, ingredients. Kitchen rituals with these in them are skipped.
          </p>
          <input
            value={allergies}
            onChange={(e) => setAllergies(e.target.value)}
            onBlur={() => save()}
            placeholder="nuts, ragweed, lanolin…"
            className={field}
          />
        </div>

        <div>
          <p className="text-sm font-medium">Foods you avoid</p>
          <p className="mt-0.5 mb-2 text-[12px] text-muted-foreground text-pretty">
            By choice or by necessity — either way, nothing suggests them at you.
          </p>
          <input
            value={avoided}
            onChange={(e) => setAvoided(e.target.value)}
            onBlur={() => save()}
            placeholder="pork, dairy, nightshades…"
            className={field}
          />
        </div>

        <p className="text-[11px] text-muted-foreground text-pretty">
          Private, and never shown to anyone else. Used only to flag things worth asking a doctor or midwife about —
          it will not tell you anything is safe.
          {pending && ' · saving…'}
        </p>
      </div>
    </section>
  )
}
