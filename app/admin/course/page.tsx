import { COURSES, pillarsOf } from '@/lib/courses'
import { getDayPillars } from '@/lib/data'
import { DayPillarEditor } from '@/components/admin/day-pillar-editor'

/** Set the pillar for every day of every course. Blank means "read it off the blocks". */
export default async function AdminCoursePage() {
  const overrides = Object.fromEntries(await Promise.all(COURSES.map(async (c) => [c.slug, await getDayPillars(c.slug)] as const)))
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Course days</h1>
        <p className="mt-1 text-sm text-muted-foreground">which pillar each day works in. blank falls back to what the day&rsquo;s blocks say; a body-first course reads as Body when nothing else is there.</p>
      </div>
      {COURSES.map((c) => (
        <section key={c.slug}>
          <h2 className="mb-2 font-serif text-xl font-semibold">{c.title}</h2>
          <DayPillarEditor slug={c.slug} days={c.days.map((d) => ({ n: d.day_number, title: d.title, week: d.week_number, derived: pillarsOf(d.blocks), set: overrides[c.slug]?.[d.day_number] ?? null }))} />
        </section>
      ))}
    </div>
  )
}
