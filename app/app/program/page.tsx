import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { COURSES } from '@/lib/courses'
import { getEnrollments } from '@/lib/data'
import { cn } from '@/lib/utils'

/** Both courses. She can hold more than one at a time. */
export default async function ProgramIndexPage({ searchParams }: { searchParams: Promise<{ all?: string }> }) {
  const { all } = await searchParams
  const enrollments = await getEnrollments()
  // One course, no decision to make — go straight to it. ?all=1 shows the list.
  if (enrollments.length === 1 && !all) redirect(`/app/program/${enrollments[0].course_slug}`)
  const bySlug = new Map(enrollments.map((e) => [e.course_slug, e]))

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-serif text-[29px] font-semibold leading-[1.1]">Programs</h1>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">start one, or carry two at once.</p>
      </div>

      <div className="flex flex-col gap-3">
        {COURSES.map((c) => {
          const enrolled = bySlug.get(c.slug)
          return (
            <Link
              key={c.slug}
              href={`/app/program/${c.slug}`}
              className={cn('rounded-2xl border bg-card p-5', enrolled ? 'border-2 border-primary' : 'border-border')}
            >
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-serif text-[19px] font-semibold">{c.title}</p>
                  <p className="mt-1 text-[14px] leading-[1.45] text-pretty text-muted-foreground">{c.subtitle}</p>
                  <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    {c.weeks} weeks · {c.length_days} days
                    {enrolled ? ' · in progress' : ''}
                  </p>
                </div>
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
