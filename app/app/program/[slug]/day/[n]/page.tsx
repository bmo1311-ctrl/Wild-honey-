import { notFound, redirect } from 'next/navigation'
import { DayView } from '@/components/course/day-view'
import { getCourse, getDay, pillarOfDay } from '@/lib/courses'
import { requireTier, getCompletedDays, getDayPillars, getEnrollment, getOwnerScope, getTodayCheckin, getTodayNutrition, getWritings, mayOpenCourse } from '@/lib/data'
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
  if (!(await mayOpenCourse(slug))) redirect('/app')
  await requireTier('circle', 'program')

  const enrollment = await getEnrollment(slug)
  if (!enrollment) redirect(`/app/program/${slug}`)

  const scope = await getOwnerScope()
  const [writings, completed, checkin, overrides, nutrition] = await Promise.all([
    getWritings(dayNumber, slug),
    getCompletedDays(slug),
    getTodayCheckin(),
    getDayPillars(slug),
    getTodayNutrition(scope?.childMemberId ?? null),
  ])
  const tracked = {
    proteinG: nutrition.protein,
    waterMl: nutrition.nutrients.water_ml ?? 0,
    caffeineMg: nutrition.nutrients.caffeine_mg ?? 0,
    mealsLogged: nutrition.loggedMeals.length,
  }
  const saved = new Map<number, CourseWriting>(writings.map((w) => [w.prompt_index, w]))

  return (
    <DayView
      course={course}
      day={day}
      saved={saved}
      checkin={checkin}
      tracked={tracked}
      done={completed.includes(dayNumber)}
      doneAt={null}
      part={part === '2' ? 2 : 1}
      pillars={pillarOfDay(day, overrides)}
    />
  )
}
