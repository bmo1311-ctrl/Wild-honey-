import { notFound, redirect } from 'next/navigation'
import { DayView } from '@/components/course/day-view'
import { getDay } from '@/lib/courses'
import { getCompletedDays, getEnrollment, getTodayCheckin, getWritings } from '@/lib/data'
import type { CourseWriting } from '@/lib/courses'

export default async function CourseDayPage({
  params,
  searchParams,
}: {
  params: Promise<{ n: string }>
  searchParams: Promise<{ part?: string }>
}) {
  const { n } = await params
  const { part } = await searchParams
  const dayNumber = Number(n)
  const day = getDay(dayNumber)
  if (!day) notFound()

  const enrollment = await getEnrollment()
  if (!enrollment) redirect('/app/program')

  const [writings, completed, checkin] = await Promise.all([getWritings(dayNumber), getCompletedDays(), getTodayCheckin()])
  const saved = new Map<number, CourseWriting>(writings.map((w) => [w.prompt_index, w]))

  return (
    <DayView
      day={day}
      saved={saved}
      checkin={checkin}
      done={completed.includes(dayNumber)}
      doneAt={null}
      part={part === '2' ? 2 : 1}
    />
  )
}
