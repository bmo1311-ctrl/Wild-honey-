import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { getCourse, weekOfDay } from '@/lib/courses'
import { getCourseState } from '@/lib/data'
import { StartCourseButton } from '@/components/course/start-course-button'
import { cn } from '@/lib/utils'

export default async function CourseOverviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const course = getCourse(slug)
  if (!course) notFound()

  const { enrollment, currentDay, completedDays } = await getCourseState(slug)

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

      <section className="flex flex-col gap-2.5">
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
                <span className="mt-0.5 block text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  {w.verb} · {days.length} days
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
