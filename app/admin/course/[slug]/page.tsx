import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { loadCourse } from '@/lib/courses-db'
import { CourseMetaEditor } from '@/components/admin/course-meta-editor'

/** Every day of one course, and the course's own title and subtitle. */
export default async function AdminCoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const course = await loadCourse(slug, true)
  if (!course) notFound()

  return (
    <div className="flex flex-col gap-5">
      <Link href="/admin/course" className="flex items-center gap-1 text-sm text-muted-foreground">
        <ChevronLeft className="h-4 w-4" />
        all courses
      </Link>

      <CourseMetaEditor slug={course.slug} title={course.title} subtitle={course.subtitle ?? ''} />

      <div>
        <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {course.days.length} days
        </p>
        <div className="flex flex-col gap-1.5">
          {course.days.map((d) => (
            <Link
              key={d.day_number}
              href={`/admin/course/${slug}/${d.day_number}`}
              className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3 ring-1 ring-border"
            >
              <span className="w-8 shrink-0 text-[13px] font-semibold text-muted-foreground">
                {d.day_number}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14.5px] font-medium">{d.title}</span>
                <span className="mt-0.5 block text-[11.5px] text-muted-foreground">
                  week {d.week_number}
                  {d.kind ? ` · ${d.kind}` : ''}
                  {d.minutes ? ` · ${d.minutes} min` : ''} · {d.blocks.length} blocks
                </span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
