import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { COURSES, currentDayFrom } from '@/lib/courses'
import { getAllEnrollments, getCompletedDays, getSessionProfile } from '@/lib/data'
import { localToday } from '@/lib/today'
import { courseAllowList } from '@/lib/kid'
import { CourseToggle } from '@/components/course/course-toggle'
import { cn } from '@/lib/utils'

/**
 * Every program, and what is waiting inside each one.
 *
 * This is where the state of her courses lives now. Today used to carry a
 * switcher between them, which meant every morning began with a reminder of
 * the programs she was not doing. The flags belong here, where she comes
 * looking on purpose.
 */
export default async function ProgramIndexPage({ searchParams }: { searchParams: Promise<{ all?: string }> }) {
  const { all } = await searchParams
  const [allEnrollments, me, today] = await Promise.all([getAllEnrollments(), getSessionProfile(), localToday()])

  // A child sees only the programs her parent turned on.
  const allowed = courseAllowList(me)
  const courses = allowed ? COURSES.filter((c) => allowed.includes(c.slug)) : COURSES
  const enrollments = allowed ? allEnrollments.filter((e) => allowed.includes(e.course_slug)) : allEnrollments
  const live = enrollments.filter((e) => e.is_active)

  // One course running and nothing set aside — no decision to make.
  if (live.length === 1 && enrollments.length === 1 && !all) redirect(`/app/program/${live[0].course_slug}`)

  const bySlug = new Map(enrollments.map((e) => [e.course_slug, e]))
  const done = new Map(await Promise.all(enrollments.map(async (e) => [e.course_slug, await getCompletedDays(e.course_slug)] as const)))

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-serif text-[29px] font-semibold leading-[1.1]">Programs</h1>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">
          switch one off any time — it keeps your place.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {courses.map((c) => {
          const e = bySlug.get(c.slug)
          const completed = done.get(c.slug) ?? []
          const day = e && e.is_active ? currentDayFrom(c, e.started_on, today) : null
          const finished = completed.length >= c.length_days

          // What is actually waiting in there, said plainly and without scolding.
          const flag = !e
            ? null
            : finished
              ? { text: 'finished', tone: 'done' as const }
              : !e.is_active
                ? { text: `set aside · ${completed.length} days done`, tone: 'paused' as const }
                : day
                  ? { text: completed.includes(day) ? `day ${day} done` : `day ${day} ready`, tone: 'live' as const }
                  : { text: 'ready', tone: 'live' as const }

          return (
            <div
              key={c.slug}
              className={cn(
                'rounded-2xl border bg-card p-5',
                e?.is_active && !finished ? 'border-2 border-primary' : 'border-border',
                e && !e.is_active && 'opacity-70',
              )}
            >
              <Link href={`/app/program/${c.slug}`} className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-serif text-[19px] font-semibold">{c.title}</p>
                  <p className="mt-1 text-[14px] leading-[1.45] text-pretty text-muted-foreground">{c.subtitle}</p>
                  <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    {c.weeks} weeks · {c.length_days} days
                  </p>
                </div>
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>

              {flag && (
                <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-1 text-[11px] font-semibold',
                      flag.tone === 'live' && 'bg-primary/15 text-primary',
                      flag.tone === 'paused' && 'bg-muted text-muted-foreground',
                      flag.tone === 'done' && 'bg-mindset-pillar/15 text-mindset-pillar',
                    )}
                  >
                    {flag.text}
                  </span>
                  {!finished && <CourseToggle slug={c.slug} active={e!.is_active} />}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
