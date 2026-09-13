import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { loadCourses } from '@/lib/courses-db'
import { CoursePublishToggle } from '@/components/admin/course-publish-toggle'

/**
 * Her courses, listed.
 *
 * This page used to do exactly one thing: set which pillar each day belonged
 * to. Everything else about a course — every word of 154 days — lived in JSON
 * files she could not reach.
 */
export default async function AdminCoursesPage() {
  const courses = await loadCourses(true)

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Courses</h1>
        <p className="mt-1 text-sm text-pretty text-muted-foreground">
          every word of every day, yours to change. Saving publishes it — members see the
          new version on their next load.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {courses.map((c) => (
          <div key={c.slug} className="rounded-3xl bg-card p-4 ring-1 ring-border">
            <div className="flex items-start gap-3">
              <Link href={`/admin/course/${c.slug}`} className="min-w-0 flex-1">
                <p className="font-serif text-lg font-semibold">{c.title}</p>
                <p className="mt-0.5 text-[13px] leading-[1.45] text-pretty text-muted-foreground">
                  {c.subtitle}
                </p>
                <p className="mt-1.5 text-[12px] text-muted-foreground">
                  {c.length_days} days · {c.weeks} weeks
                </p>
              </Link>
              <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
            </div>
            {/*
              Unpublishing hides a course from members without deleting a
              thing, so she can rewrite one in place rather than editing
              something people are reading mid-sentence.
            */}
            <div className="mt-3 border-t border-border pt-3">
              <CoursePublishToggle slug={c.slug} published={c.published} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
