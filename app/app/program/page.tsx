import Link from 'next/link'
import { Check, ChevronRight } from 'lucide-react'
import { COURSE } from '@/lib/courses'
import { getCourseState } from '@/lib/data'
import { StartCourseButton } from '@/components/course/start-course-button'
import { cn } from '@/lib/utils'

export default async function ProgramPage() {
  const { enrollment, currentDay, completedDays } = await getCourseState()

  if (!enrollment || currentDay === null) {
    return (
      <div className="flex flex-col gap-6">
        <header>
          <h1 className="font-serif text-3xl font-semibold">{COURSE.title}</h1>
          <p className="mt-1.5 text-[16.5px] leading-[1.5] text-pretty text-muted-foreground">{COURSE.subtitle}</p>
        </header>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="font-serif text-xl font-semibold">Start the course</p>
          <p className="mt-1.5 text-[15px] leading-[1.5] text-pretty text-muted-foreground">
            Eight weeks, fifty-six days. Today becomes day one.
          </p>
          <StartCourseButton />
        </div>
      </div>
    )
  }

  const done = completedDays.length
  const pct = Math.round((done / COURSE.length_days) * 100)
  const currentWeek = Math.floor((currentDay - 1) / 7) + 1

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-serif text-[29px] font-semibold leading-[1.1]">{COURSE.title}</h1>
        <p className="mt-1.5 text-[15px] leading-[1.5] text-pretty text-muted-foreground">{COURSE.subtitle}</p>
      </header>

      <section className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-serif text-[17px] font-semibold">
            Day {currentDay} of {COURSE.length_days}
          </p>
          <p className="text-sm text-muted-foreground">
            {done} done · {pct}%
          </p>
        </div>
        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
        </div>

        {/* 56 dots — a missed day is a gap, never a reproach. */}
        <div className="mt-3 grid grid-cols-14 gap-1">
          {COURSE.days.map((d) => {
            const isDone = completedDays.includes(d.day_number)
            const isToday = d.day_number === currentDay
            return (
              <span
                key={d.day_number}
                title={`Day ${d.day_number}`}
                className={cn(
                  'aspect-square rounded-full',
                  isDone ? 'bg-mindset-pillar' : isToday ? 'bg-card shadow-[inset_0_0_0_2px_var(--primary)]' : 'bg-muted',
                )}
              />
            )
          })}
        </div>
      </section>

      <section className="flex flex-col gap-2.5">
        {COURSE.week_list.map((w) => {
          const days = COURSE.days.filter((d) => d.week_number === w.week_number)
          const weekDone = days.every((d) => completedDays.includes(d.day_number))
          const isCurrent = w.week_number === currentWeek
          return (
            <Link
              key={w.week_number}
              href={`/app/program/week/${w.week_number}`}
              className={cn(
                'flex items-center gap-3 rounded-2xl border bg-card p-4',
                isCurrent ? 'border-2 border-primary' : 'border-border',
                weekDone && !isCurrent && 'opacity-70',
              )}
            >
              <span
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                  weekDone ? 'bg-mindset-pillar text-white' : isCurrent ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
                )}
              >
                {weekDone ? <Check className="h-4 w-4" strokeWidth={3} /> : w.week_number}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold text-pretty">{w.title}</span>
                <span className="mt-0.5 block text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{w.verb}</span>
                {isCurrent && (
                  <span className="mt-1 block text-xs text-primary">
                    day {currentDay} of {COURSE.length_days} · you are here
                  </span>
                )}
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          )
        })}
      </section>
    </div>
  )
}
