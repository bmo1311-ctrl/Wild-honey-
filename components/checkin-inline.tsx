'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Check } from 'lucide-react'
import { saveCheckin } from '@/app/actions'
import { cn } from '@/lib/utils'

/**
 * The check-in, answered without leaving Today.
 *
 * The numbers said this plainly: 62 meals logged against 5 check-ins. Meal
 * logging is the one thing that was made reachable in a single tap from this
 * page, and it is the one thing that got used. The check-in was still what
 * meal logging used to be — tap a card, land on another page, fill it in,
 * save, get pushed back.
 *
 * That matters more than it looks, because almost everything the app wants to
 * become is built on check-ins. Capacity, patterns, anything worth calling
 * noticing: all of it needs her to have said how she is, more than five times.
 * No amount of engine work substitutes for the three taps happening.
 *
 * So: three rows, in place, and it saves itself on the third tap. There is no
 * save button, because a save button is a fourth tap and a decision, and the
 * whole point is that there is nothing to decide.
 */

const SCALES = [
  { key: 'energy', label: 'energy', low: 'flat', high: 'buzzing' },
  { key: 'sleep_quality', label: 'sleep', low: 'rough', high: 'slept well' },
  { key: 'stress', label: 'stress', low: 'calm', high: 'wired' },
] as const

type Key = (typeof SCALES)[number]['key']

export function CheckinInline({
  existing,
}: {
  existing: { energy: number | null; sleep_quality: number | null; stress: number | null } | null
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [saved, setSaved] = useState(
    Boolean(existing?.energy && existing?.sleep_quality && existing?.stress),
  )
  const [v, setV] = useState<Record<Key, number | null>>({
    energy: existing?.energy ?? null,
    sleep_quality: existing?.sleep_quality ?? null,
    stress: existing?.stress ?? null,
  })

  function pick(key: Key, n: number) {
    const next = { ...v, [key]: n }
    setV(next)

    // The third answer is the save. Nothing else to press.
    if (!next.energy || !next.sleep_quality || !next.stress) return
    setSaved(true)
    startTransition(async () => {
      const res = await saveCheckin({
        energy: next.energy ?? undefined,
        sleepQuality: next.sleep_quality ?? undefined,
        stress: next.stress ?? undefined,
      })
      if (res && 'error' in res && res.error) {
        setSaved(false)
        toast.error(res.error)
        return
      }
      toast.success('Noted.')
      router.refresh()
    })
  }

  /*
   * Once it is done it stays visible but gets out of the way — one line, and
   * still tappable in case the morning turned out differently than it looked.
   * Hiding it entirely would make the page jump and leave her wondering
   * whether it saved.
   */
  if (saved) {
    return (
      <button
        type="button"
        onClick={() => setSaved(false)}
        className="flex w-full items-center gap-2.5 rounded-2xl bg-card px-4 py-3 text-left ring-1 ring-border"
      >
        <span className="hex-clip flex h-7 w-7 shrink-0 items-center justify-center bg-honey text-honey-foreground">
          <Check className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1 text-[14px]">
          checked in — energy {v.energy}, sleep {v.sleep_quality}, stress {v.stress}
        </span>
        <span className="shrink-0 text-[12.5px] text-muted-foreground">change</span>
      </button>
    )
  }

  return (
    <section className="flex flex-col gap-3.5 rounded-2xl bg-card p-4 ring-1 ring-border">
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-serif text-[17px] font-semibold">how are you today?</p>
        <Link href="/app/checkin" className="shrink-0 text-[12.5px] font-medium text-muted-foreground underline underline-offset-[3px]">
          more
        </Link>
      </div>

      {SCALES.map((s) => (
        <div key={s.key} className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between">
            <span className="text-[12.5px] font-medium">{s.label}</span>
            <span className="text-[11px] text-muted-foreground">
              {v[s.key] ? `${v[s.key]}/10` : `${s.low} → ${s.high}`}
            </span>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => pick(s.key, n)}
                aria-label={`${s.label} ${n}`}
                /*
                 * Full-height targets rather than small dots. This is tapped
                 * on a phone, half asleep, and a 6px target at 7am is how a
                 * daily habit quietly stops being daily.
                 */
                className={cn(
                  'h-8 flex-1 rounded-sm transition-colors',
                  v[s.key] && n <= (v[s.key] as number) ? 'bg-honey' : 'bg-secondary',
                )}
              />
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}
