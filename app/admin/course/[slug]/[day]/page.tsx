import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { loadCourse } from '@/lib/courses-db'
import { CourseDayEditor } from '@/components/admin/course-day-editor'

/** One day, editable — text, headings, photographs, video, prompts. */
export default async function AdminCourseDayPage({
  params,
}: {
  params: Promise<{ slug: string; day: string }>
}) {
  const { slug, day } = await params
  const dayNumber = Number(day)
  const course = await loadCourse(slug, true)
  const d = course?.days.find((x) => x.day_number === dayNumber)
  if (!course || !d) notFound()

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link href={`/admin/course/${slug}`} className="flex items-center gap-1 text-sm text-muted-foreground">
          <ChevronLeft className="h-4 w-4" />
          {course.title}
        </Link>
        <h1 className="mt-1.5 font-serif text-2xl font-semibold">
          Day {d.day_number} · week {d.week_number}
        </h1>
      </div>

      <CourseDayEditor
        slug={slug}
        dayNumber={dayNumber}
        initial={{ title: d.title, kind: d.kind, minutes: d.minutes, blocks: d.blocks }}
      />
    </div>
  )
}
