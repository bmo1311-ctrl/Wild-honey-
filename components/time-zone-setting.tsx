'use client'

import { useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { saveTimeZone } from '@/app/actions'
import { cn } from '@/lib/utils'

/**
 * Where she is, so the app knows what time it is there.
 *
 * The common zones are listed because almost everyone is in one of them and
 * a dropdown of six hundred is its own kind of friction. The full list is one
 * tap away for anyone who is not.
 *
 * It shows the current time in the selected zone as she picks, which is the
 * only check that actually matters — she can see at a glance whether the app
 * now agrees with the clock on her wall.
 */

const COMMON: { zone: string; label: string }[] = [
  { zone: 'America/Los_Angeles', label: 'Pacific' },
  { zone: 'America/Phoenix', label: 'Arizona' },
  { zone: 'America/Denver', label: 'Mountain' },
  { zone: 'America/Chicago', label: 'Central' },
  { zone: 'America/New_York', label: 'Eastern' },
  { zone: 'America/Anchorage', label: 'Alaska' },
  { zone: 'Pacific/Honolulu', label: 'Hawaii' },
  { zone: 'Europe/London', label: 'UK' },
  { zone: 'Europe/Paris', label: 'Central Europe' },
  { zone: 'Australia/Sydney', label: 'Sydney' },
]

function allZones(): string[] {
  try {
    const s = Intl as unknown as { supportedValuesOf?: (k: string) => string[] }
    return s.supportedValuesOf?.('timeZone') ?? []
  } catch {
    return []
  }
}

function timeIn(zone: string): string | null {
  try {
    return new Date().toLocaleTimeString('en-US', {
      timeZone: zone,
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return null
  }
}

export function TimeZoneSetting({ initial }: { initial: string | null }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [zone, setZone] = useState<string | null>(initial)
  const [showAll, setShowAll] = useState(false)
  const [detected, setDetected] = useState<string | null>(null)
  const [now, setNow] = useState<string | null>(null)

  useEffect(() => {
    try {
      setDetected(Intl.DateTimeFormat().resolvedOptions().timeZone ?? null)
    } catch {
      /* ignore */
    }
  }, [])

  // Tick, so the preview is a live clock rather than a number frozen at load.
  useEffect(() => {
    const active = zone ?? detected
    if (!active) return
    setNow(timeIn(active))
    const t = setInterval(() => setNow(timeIn(active)), 10_000)
    return () => clearInterval(t)
  }, [zone, detected])

  function choose(next: string | null) {
    setZone(next)
    start(async () => {
      const res = await saveTimeZone(next)
      if (res && 'error' in res && res.error) {
        toast.error(res.error)
        return
      }
      // Every page that greets her by the hour has to be re-rendered.
      router.refresh()
      toast.success(next ? 'Saved.' : 'Back to detecting it automatically.')
    })
  }

  const active = zone ?? detected
  const zones = showAll ? allZones() : []

  return (
    <section>
      <p className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        your timezone
      </p>
      <div className="flex flex-col gap-4 rounded-3xl bg-card p-4 ring-1 ring-border">
        <div>
          <p className="text-sm font-medium">Where you are</p>
          <p className="mt-0.5 text-[12.5px] leading-[1.45] text-pretty text-muted-foreground">
            Decides what counts as today, when a course day rolls over, and whether Today greets you
            with morning or evening.
          </p>
        </div>

        {/* The only check that matters: does this agree with your own clock? */}
        {active && now && (
          <div className="rounded-2xl bg-muted/40 px-3 py-2.5">
            <p className="text-[12.5px] text-muted-foreground">
              it is <span className="font-semibold text-foreground">{now}</span> in{' '}
              <span className="font-medium text-foreground">{active.split('/').pop()?.replace(/_/g, ' ')}</span>
              {zone ? '' : ' — detected from your device'}
            </p>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">
              If that is not the time where you are, pick the right one below.
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5">
          {COMMON.map((c) => (
            <button
              key={c.zone}
              type="button"
              onClick={() => choose(c.zone)}
              className={cn(
                'rounded-full px-3 py-1.5 text-[13px] font-medium ring-1 transition-colors',
                zone === c.zone
                  ? 'bg-foreground text-background ring-foreground'
                  : 'text-muted-foreground ring-border',
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        {showAll ? (
          <select
            value={zone ?? ''}
            onChange={(e) => choose(e.target.value || null)}
            className="h-11 w-full rounded-2xl border border-border bg-background px-3 text-[14px] outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <option value="">detect it automatically</option>
            {zones.map((z) => (
              <option key={z} value={z}>
                {z.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        ) : (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="self-start text-[12.5px] text-muted-foreground underline underline-offset-2"
          >
            somewhere else
          </button>
        )}

        {zone && (
          <button
            type="button"
            onClick={() => choose(null)}
            className="self-start text-[12.5px] text-muted-foreground underline underline-offset-2"
          >
            go back to detecting it automatically
          </button>
        )}

        {pending && <p className="text-[11.5px] text-muted-foreground">saving…</p>}
      </div>
    </section>
  )
}
