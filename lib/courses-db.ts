import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { COURSES as SEED } from '@/lib/courses'
import type { Course, CourseDay } from '@/lib/courses'

/**
 * Courses, read from the database instead of the repo.
 *
 * All four lived as JSON files — 312KB, 154 days, every word of it hers —
 * which meant she could not fix a typo in her own programme without a
 * developer and a deploy. The JSON is still in the repo, but it is a seed
 * now rather than the source of truth.
 *
 * The seeding is lazy and idempotent. The first read after the tables are
 * created copies the files in; after that the database wins and the files
 * are only there so a fresh environment comes up populated. That avoids a
 * migration step someone has to remember to run, and it means this is safe
 * to deploy before anything has been imported.
 */

let seedChecked = false

/**
 * Copy the bundled JSON in, but only into an empty table.
 *
 * The guard matters more than it looks: without the count check, a deploy
 * would silently overwrite every edit she had made with the original text.
 * Empty means untouched; anything else means hands off.
 */
export async function ensureCoursesSeeded(): Promise<void> {
  if (seedChecked) return
  seedChecked = true
  try {
    const admin = createServiceClient()
    const { count } = await admin.from('courses').select('slug', { count: 'exact', head: true })
    if ((count ?? 0) > 0) return

    for (const c of SEED) {
      await admin.from('courses').upsert(
        {
          slug: c.slug,
          title: c.title,
          subtitle: c.subtitle ?? null,
          length_days: c.length_days,
          weeks: c.weeks,
          week_list: c.week_list ?? [],
        },
        { onConflict: 'slug' },
      )
      // In batches — 56 days of blocks in one statement is a large payload.
      const days = c.days.map((d) => ({
        slug: c.slug,
        day_number: d.day_number,
        week_number: d.week_number,
        title: d.title,
        kind: d.kind ?? null,
        minutes: d.minutes ?? null,
        blocks: d.blocks ?? [],
      }))
      for (let i = 0; i < days.length; i += 10) {
        await admin.from('course_days').upsert(days.slice(i, i + 10), { onConflict: 'slug,day_number' })
      }
    }
  } catch {
    // A failed seed must never take the app down — reads fall back to the
    // bundled JSON below, which is exactly what shipped before this existed.
    seedChecked = false
  }
}

type DayRow = {
  day_number: number
  week_number: number
  title: string
  kind: string | null
  minutes: number | null
  blocks: unknown
}

/**
 * Every course she has, newest edits included.
 *
 * Falls back to the bundled JSON whenever the database has nothing to say —
 * a cold start, a seed that has not run, or an outage. A member should never
 * see an empty programme because a table was empty.
 */
export async function loadCourses(includeUnpublished = false): Promise<Course[]> {
  await ensureCoursesSeeded()
  try {
    const supabase = await createClient()
    let q = supabase.from('courses').select('*').order('sort_order', { ascending: true })
    if (!includeUnpublished) q = q.eq('published', true)
    const { data: courses } = await q
    if (!courses || courses.length === 0) return SEED

    const { data: days } = await supabase
      .from('course_days')
      .select('*')
      .order('day_number', { ascending: true })

    const byslug = new Map<string, DayRow[]>()
    for (const d of (days ?? []) as unknown as (DayRow & { slug: string })[]) {
      const list = byslug.get(d.slug) ?? []
      list.push(d)
      byslug.set(d.slug, list)
    }

    return courses.map((c) => ({
      slug: c.slug as string,
      title: c.title as string,
      subtitle: (c.subtitle as string) ?? '',
      length_days: c.length_days as number,
      weeks: c.weeks as number,
      week_list: (c.week_list ?? []) as Course['week_list'],
      days: (byslug.get(c.slug as string) ?? []).map((d) => ({
        day_number: d.day_number,
        week_number: d.week_number,
        title: d.title,
        kind: d.kind,
        minutes: d.minutes,
        blocks: d.blocks,
      })) as CourseDay[],
    })) as Course[]
  } catch {
    return SEED
  }
}

export async function loadCourse(slug: string, includeUnpublished = false): Promise<Course | null> {
  const all = await loadCourses(includeUnpublished)
  return all.find((c) => c.slug === slug) ?? null
}

export async function loadDay(slug: string, dayNumber: number): Promise<CourseDay | null> {
  const course = await loadCourse(slug)
  return course?.days.find((d) => d.day_number === dayNumber) ?? null
}
