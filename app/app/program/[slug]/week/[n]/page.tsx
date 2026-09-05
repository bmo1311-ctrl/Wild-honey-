import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Check, ChevronRight } from 'lucide-react'
import { Blocks } from '@/components/course/blocks'
import { daysInWeek, getCourse, getWeek } from '@/lib/courses'
import { getCompletedDays } from '@/lib/data'
import { cn } from '@/lib/utils'

export default async function CourseWeekPage({ params }: { params: Promise<{ slug: string; n: string }> }) {
  const { slug, n } = await params
  const course = getCourse(slug)
  if (!course) notFound()
  const week = getWeek(course, Number(n))
  if (!week) notFound()

  const completed = await getCompletedDays(slug)
  // days come from their own week_number, so a nine-day week four is right
  const days = daysInWeek(course, week.week_number)

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-[11px] uppercase tracking-[0.14em] text-mindset-pillar">Week {week.week_number} · {week.verb}</p>
        <h1 className="mt-2 font-serif text-[25px] font-semibold leading-[1.15] text-balance">{week.opening_line}</h1>
        <p className="mt-3 text-[16.5px] leading-[1.5] text-pretty text-muted-foreground">{week.stakes}</p>
      </header>

      <Blocks blocks={week.blocks} ctx={{ dayNumber: null, slug }} />

      <div>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">the seven days</h2>
        <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
          {days.map((d, i) => {
            const done = completed.includes(d.day_number)
            return (
              <Link
                key={d.day_number}
                href={`/app/program/${slug}/day/${d.day_number}`}
                className={cn('flex items-center gap-3 px-4 py-3.5', i > 0 && 'border-t border-border')}
              >
                <span
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold',
                    done ? 'bg-mindset-pillar text-white' : 'bg-muted text-muted-foreground',
                  )}
                >
                  {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : d.day_number}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{d.title}</span>
                  <span className="block text-xs text-muted-foreground">{d.kind} · {d.minutes} min</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
