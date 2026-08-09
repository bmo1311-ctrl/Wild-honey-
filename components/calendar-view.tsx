'use client'

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Sun } from 'lucide-react'
import { CalendarDayPanel } from '@/components/calendar-day-panel'
import { FIXED_MONTHS, gregorianToFixed, fixedToGregorian, leapDayGregorian, yearDayGregorian, isGregorianLeapYear, toISODate } from '@/lib/fixed-calendar'
import { cn } from '@/lib/utils'

type Mode = 'standard' | 'wildhoney'

const GREGORIAN_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export function CalendarView() {
  const today = new Date()
  const todayISO = toISODate(today)
  const todayFixed = gregorianToFixed(today)

  const [mode, setMode] = useState<Mode>('wildhoney')
  const [year, setYear] = useState(today.getUTCFullYear())
  // For Wild Honey mode: 0-12 = months, 13 = leap day (if applicable), 14 = year day
  // For Standard mode: 0-11 = gregorian months
  const [cursor, setCursor] = useState(mode === 'wildhoney' ? todayFixed.kind === 'month' ? todayFixed.monthIndex : 13 : today.getUTCMonth())
  const [selected, setSelected] = useState<{ dateISO: string; label: string } | null>(null)

  function switchMode(next: Mode) {
    setMode(next)
    setSelected(null)
    if (next === 'wildhoney') {
      setCursor(todayFixed.kind === 'month' ? todayFixed.monthIndex : 6)
    } else {
      setCursor(today.getUTCMonth())
    }
    setYear(today.getUTCFullYear())
  }

  const leap = isGregorianLeapYear(year)

  function goPrev() {
    if (mode === 'standard') {
      if (cursor === 0) {
        setCursor(11)
        setYear((y) => y - 1)
      } else setCursor((c) => c - 1)
    } else {
      if (cursor === 0) {
        setCursor(12)
        setYear((y) => y - 1)
      } else setCursor((c) => c - 1)
    }
  }

  function goNext() {
    if (mode === 'standard') {
      if (cursor === 11) {
        setCursor(0)
        setYear((y) => y + 1)
      } else setCursor((c) => c + 1)
    } else {
      if (cursor === 12) {
        setCursor(0)
        setYear((y) => y + 1)
      } else setCursor((c) => c + 1)
    }
  }

  const wildHoneyDays = useMemo(() => {
    if (mode !== 'wildhoney') return []
    const days = []
    for (let d = 1; d <= 28; d++) {
      const g = fixedToGregorian(year, cursor, d)
      days.push({ day: d, gregorian: g, iso: toISODate(g) })
    }
    return days
  }, [mode, year, cursor])

  const standardDays = useMemo(() => {
    if (mode !== 'standard') return []
    const first = new Date(Date.UTC(year, cursor, 1))
    const startWeekday = first.getUTCDay()
    const daysInMonth = new Date(Date.UTC(year, cursor + 1, 0)).getUTCDate()
    const cells: ({ day: number; iso: string } | null)[] = []
    for (let i = 0; i < startWeekday; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) {
      const g = new Date(Date.UTC(year, cursor, d))
      cells.push({ day: d, iso: toISODate(g) })
    }
    return cells
  }, [mode, year, cursor])

  function selectDay(iso: string, label: string) {
    setSelected({ dateISO: iso, label })
  }

  const isSol = mode === 'wildhoney' && cursor === 6
  const monthLabel = mode === 'wildhoney' ? FIXED_MONTHS[cursor] : GREGORIAN_MONTHS[cursor]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1.5 rounded-full bg-secondary p-1">
        <button
          type="button"
          onClick={() => switchMode('standard')}
          className={cn('flex-1 rounded-full py-2 text-xs font-medium transition-colors', mode === 'standard' ? 'bg-foreground text-background' : 'text-muted-foreground')}
        >
          standard
        </button>
        <button
          type="button"
          onClick={() => switchMode('wildhoney')}
          className={cn('flex-1 rounded-full py-2 text-xs font-medium transition-colors', mode === 'wildhoney' ? 'bg-foreground text-background' : 'text-muted-foreground')}
        >
          wild honey
        </button>
      </div>

      <div className={cn('flex flex-col gap-3 rounded-2xl p-5 ring-1', isSol ? 'bg-honey/10 ring-honey/30' : 'bg-card ring-border')}>
        {mode === 'wildhoney' && cursor === 13 ? (
          <SpecialDayView
            title="Leap Day"
            date={leapDayGregorian(year)}
            onSelect={selectDay}
            onBack={() => setCursor(5)}
          />
        ) : mode === 'wildhoney' && cursor === 14 ? (
          <SpecialDayView
            title="Year Day"
            subtitle="reflect · integrate · celebrate · begin again"
            date={yearDayGregorian(year)}
            onSelect={selectDay}
            onBack={() => setCursor(12)}
            isYearDay
          />
        ) : (
          <>
            <div className="flex items-center justify-between">
              <button type="button" onClick={goPrev} className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="text-center">
                <p className={cn('font-serif text-xl font-semibold', isSol && 'text-honey')}>{monthLabel}</p>
                <p className="text-xs text-muted-foreground">{year}</p>
              </div>
              <button type="button" onClick={goNext} className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {isSol && <p className="text-center text-xs text-honey">a threshold month — reflect, integrate, celebrate, begin again</p>}

            <div className="grid grid-cols-7 gap-1 text-center text-[0.65rem] text-muted-foreground">
              {WEEKDAY_LABELS.map((w, i) => (
                <span key={i}>{w}</span>
              ))}
            </div>

            {mode === 'wildhoney' ? (
              <div className="grid grid-cols-7 gap-1">
                {wildHoneyDays.map((d) => (
                  <DayCell key={d.iso} label={d.day} iso={d.iso} isToday={d.iso === todayISO} isSol={isSol} onClick={() => selectDay(d.iso, `${monthLabel} ${d.day}, ${year}`)} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-1">
                {standardDays.map((d, i) =>
                  d ? (
                    <DayCell key={d.iso} label={d.day} iso={d.iso} isToday={d.iso === todayISO} onClick={() => selectDay(d.iso, `${monthLabel} ${d.day}, ${year}`)} />
                  ) : (
                    <span key={i} />
                  ),
                )}
              </div>
            )}

            {mode === 'wildhoney' && cursor === 5 && leap && (
              <button type="button" onClick={() => setCursor(13)} className="rounded-xl bg-secondary/60 py-2 text-center text-xs font-medium text-muted-foreground">
                → Leap Day (this year)
              </button>
            )}
            {mode === 'wildhoney' && cursor === 12 && (
              <button type="button" onClick={() => setCursor(14)} className="rounded-xl bg-honey/15 py-2 text-center text-xs font-medium text-honey">
                → Year Day
              </button>
            )}
          </>
        )}
      </div>

      {selected && <CalendarDayPanel dateISO={selected.dateISO} label={selected.label} onClose={() => setSelected(null)} />}
    </div>
  )
}

function DayCell({ label, iso, isToday, isSol, onClick }: { label: number; iso: string; isToday: boolean; isSol?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex aspect-square items-center justify-center rounded-lg text-sm transition-colors',
        isToday ? 'bg-foreground text-background font-semibold' : isSol ? 'bg-honey/10 text-foreground hover:bg-honey/20' : 'bg-secondary/40 text-foreground hover:bg-secondary',
      )}
    >
      {label}
    </button>
  )
}

function SpecialDayView({
  title,
  subtitle,
  date,
  onSelect,
  onBack,
  isYearDay,
}: {
  title: string
  subtitle?: string
  date: Date | null
  onSelect: (iso: string, label: string) => void
  onBack: () => void
  isYearDay?: boolean
}) {
  if (!date) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <p className="text-sm text-muted-foreground">{title} doesn't occur this year.</p>
        <button type="button" onClick={onBack} className="text-xs font-medium text-honey">
          ← back
        </button>
      </div>
    )
  }
  const iso = toISODate(date)
  return (
    <div className="flex flex-col items-center gap-3 py-4 text-center">
      <Sun className="h-8 w-8 text-honey" />
      <p className="font-serif text-2xl font-semibold text-honey">{title}</p>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      <p className="text-xs text-muted-foreground">{date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
      <button type="button" onClick={() => onSelect(iso, title)} className="rounded-full bg-honey px-5 py-2 text-sm font-medium text-honey-foreground">
        open {title.toLowerCase()}
      </button>
      <button type="button" onClick={onBack} className="text-xs font-medium text-muted-foreground">
        ← back to months
      </button>
    </div>
  )
}
