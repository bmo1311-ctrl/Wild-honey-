import { notFound, redirect } from 'next/navigation'
import { DayView } from '@/components/course/day-view'
import { getCourse, getDay, pillarOfDay } from '@/lib/courses'
import { getCompletedDays, getDayPillars, getEnrollment, getTodayCheckin, getWritings } from '@/lib/data'
import type { CourseWriting } from '@/lib/courses'

export default async function CourseDayPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; n: string }>
  searchParams: Promise<{ part?: string }>
}) {
  const { slug, n } = await params
  const { part } = await searchParams
  const course = getCourse(slug)
  if (!course) notFound()
  const dayNumber = Number(n)
  const day = getDay(course, dayNumber)
  if (!day) notFound()

  const enrollment = await getEnrollment(slug)
  if (!enrollment) redirect(`/app/program/${slug}`)

  const [writings, completed, checkin, overrides] = await Promise.all([
    getWritings(dayNumber, slug),
    getCompletedDays(slug),
    getTodayCheckin(),
    getDayPillars(slug),
  ])
  const saved = new Map<number, CourseWriting>(writings.map((w) => [w.prompt_index, w]))

  return (
    <DayView
      course={course}
      day={day}
      saved={saved}
      checkin={checkin}
      done={completed.includes(dayNumber)}
      doneAt={null}
      part={part === '2' ? 2 : 1}
      pillars={pillarOfDay(day, overrides)}
    />
  )
}
