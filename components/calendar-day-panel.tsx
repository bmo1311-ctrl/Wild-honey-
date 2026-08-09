'use client'

import { useEffect, useState } from 'react'
import { X, Sparkles, BookOpen, Utensils, Flame } from 'lucide-react'
import { getDaySnapshot } from '@/app/actions'

const CYCLE_LABEL: Record<string, string> = {
  menstrual: 'menstrual phase',
  follicular: 'follicular phase',
  ovulation: 'ovulation phase',
  luteal: 'luteal phase',
}

export function CalendarDayPanel({ dateISO, label, onClose }: { dateISO: string; label: string; onClose: () => void }) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<Awaited<ReturnType<typeof getDaySnapshot>> | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getDaySnapshot(dateISO).then((res) => {
      if (!cancelled) {
        setData(res)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [dateISO])

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-card p-5 ring-1 ring-border">
      <div className="flex items-center justify-between">
        <p className="font-serif text-lg font-semibold">{label}</p>
        <button type="button" onClick={onClose} className="text-muted-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">loading…</p>
      ) : !data || (!data.checkin && data.entries.length === 0 && data.meals.length === 0 && data.habitLogs.length === 0) ? (
        <p className="text-sm text-muted-foreground">nothing logged for this day.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {data.checkin && (
            <div className="flex flex-col gap-1 rounded-xl bg-secondary/40 p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Sparkles className="h-3 w-3" />
                check-in
              </p>
              <div className="flex flex-wrap gap-3 text-sm">
                {data.checkin.cycle_phase && data.checkin.cycle_phase !== 'not_tracked' && (
                  <span>{CYCLE_LABEL[data.checkin.cycle_phase] ?? data.checkin.cycle_phase}</span>
                )}
                {data.checkin.energy !== null && <span>energy {data.checkin.energy}/10</span>}
                {data.checkin.mood && <span>mood: {data.checkin.mood}</span>}
                {data.checkin.sleep_quality !== null && <span>sleep {data.checkin.sleep_quality}/10</span>}
              </div>
            </div>
          )}

          {data.entries.length > 0 && (
            <div className="flex flex-col gap-1 rounded-xl bg-secondary/40 p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <BookOpen className="h-3 w-3" />
                journal
              </p>
              {data.entries.map((e: any) => (
                <p key={e.id} className="text-sm text-pretty">
                  {e.text.length > 140 ? `${e.text.slice(0, 140)}…` : e.text}
                </p>
              ))}
            </div>
          )}

          {data.meals.length > 0 && (
            <div className="flex flex-col gap-1 rounded-xl bg-secondary/40 p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Utensils className="h-3 w-3" />
                meals logged
              </p>
              {data.meals.map((m: any) => (
                <p key={m.id} className="text-sm">
                  {m.recipe?.title} {m.servings !== 1 ? `× ${m.servings}` : ''}
                </p>
              ))}
            </div>
          )}

          {data.habitLogs.length > 0 && (
            <div className="flex flex-col gap-1 rounded-xl bg-secondary/40 p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Flame className="h-3 w-3" />
                habits completed
              </p>
              <p className="text-sm">{data.habitLogs.map((h: any) => h.habit?.title).filter(Boolean).join(', ')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
