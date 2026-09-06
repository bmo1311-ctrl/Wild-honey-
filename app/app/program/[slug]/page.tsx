import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { getCourse, pillarOfDay, weekOfDay, type Pillar4 } from '@/lib/courses'
import { PillarDots } from '@/components/course/pillar-dots'
import { PillarFilter } from '@/components/course/pillar-filter'
import { getCourseState, getDayPillars } from '@/lib/data'
import { StartCourseButton } from '@/components/course/start-course-button'
import { cn } from '@/lib/utils'

export default async function CourseOverviewPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ pillar?: string }> }) {
  const { slug } = await params
  const { pillar } = await searchParams
  const course = getCourse(slug)
  if (!course) notFound()

  const [{ enrollment, currentDay, completedDays }, overrides] = await Promise.all([getCourseState(slug), getDayPillars(slug)])

  if (!enrollment || currentDay === null) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <Link href="/app/program?all=1" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground">
            <ChevronLeft className="h-4 w-4" /> All programs
          </Link>
          <h1 className="font-serif text-[29px] font-semibold leading-[1.1]">{course.title}</h1>
          <p className="mt-1.5 text-[16.5px] leading-[1.5] text-pretty text-muted-foreground">{course.subtitle}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="font-serif text-xl font-semibold">
            {course.weeks} weeks. {course.length_days} days.
          </p>
          <p className="mt-1.5 text-[15px] leading-[1.5] text-pretty text-muted-foreground">Today becomes day one.</p>
          <StartCourseButton slug={slug} />
        </div>
      </div>
    )
  }

  const done = completedDays.length
  const pct = Math.round((done / course.length_days) * 100)
  const currentWeek = weekOfDay(course, currentDay)
  const byDay = new Map(course.days.map((d) => [d.day_number, pillarOfDay(d, overrides)]))
  const counts: Record<string, number> = {}
  for (const ps of byDay.values()) for (const p of ps) counts[p] = (counts[p] ?? 0) + 1
  const filtered = pillar ? course.days.filter((d) => byDay.get(d.day_number)?.includes(pillar as Pillar4)) : []

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/app/program?all=1" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ChevronLeft className="h-4 w-4" /> All programs
        </Link>
        <h1 className="font-serif text-[29px] font-semibold leading-[1.1]">{course.title}</h1>
        <p className="mt-1 text-[15px] leading-[1.5] text-pretty text-muted-foreground">{course.subtitle}</p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-serif text-[17px] font-semibold">
            Day {currentDay} of {course.length_days}
          </p>
          <p className="text-sm text-muted-foreground">
            {done} done · {pct}%
          </p>
        </div>
        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
        <div className={cn('mt-3 grid gap-1', course.length_days > 40 ? 'grid-cols-14' : 'grid-cols-10')}>
          {course.days.map((d) => {
            const isDone = completedDays.includes(d.day_number)
            const isToday = d.day_number === currentDay
            return (
              <Link
                key={d.day_number}
                href={`/app/program/${slug}/day/${d.day_number}`}
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

      <PillarFilter counts={counts} />

      {pillar && (
        <section>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">{filtered.length} {pillar} {filtered.length === 1 ? 'day' : 'days'}</h2>
          <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
            {filtered.map((d, i) => (
              <Link key={d.day_number} href={`/app/program/${slug}/day/${d.day_number}`} className={cn('flex items-center gap-3 px-4 py-3', i > 0 && 'border-t border-border')}>
                <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[11px] font-bold', completedDays.includes(d.day_number) ? 'bg-mindset-pillar text-white' : 'bg-muted text-muted-foreground')}>{d.day_number}</span>
                <span className="min-w-0 flex-1"><span className="block truncate text-[15px] font-medium">{d.title}</span><span className="block text-xs text-muted-foreground">week {d.week_number} · {d.kind} · {d.minutes} min</span></span>
                <PillarDots pillars={byDay.get(d.day_number) ?? []} />
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className={cn('flex flex-col gap-2.5', pillar && 'hidden')}>
        {course.week_list.map((w) => {
          // days come from their own week_number — week four of Daily Bread is nine days
          const days = course.days.filter((d) => d.week_number === w.week_number)
          const weekDone = days.length > 0 && days.every((d) => completedDays.includes(d.day_number))
          const isCurrent = w.week_number === currentWeek
          return (
            <Link
              key={w.week_number}
              href={`/app/program/${slug}/week/${w.week_number}`}
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
                <span className="mt-0.5 flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  {w.verb} · {days.length} days
                  <PillarDots pillars={[...new Set(days.flatMap((d) => byDay.get(d.day_number) ?? []))] as Pillar4[]} />
                </span>
                {isCurrent && <span className="mt-1 block text-xs text-primary">day {currentDay} · you are here</span>}
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          )
        })}
      </section>
    </div>
  )
}
