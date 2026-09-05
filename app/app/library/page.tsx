import Link from 'next/link'
import { COURSE } from '@/lib/courses'
import { libraryModules } from '@/lib/modules'
import { getRecipes, getResources, getWorkouts } from '@/lib/data'
import { youTubeId } from '@/lib/youtube'

/** Doors come from the module registry, so a new area appears here on its own. */
export default async function LibraryPage() {
  const [resources, recipes, workouts] = await Promise.all([getResources(), getRecipes(), getWorkouts()])
  const counts = {
    videos: resources.filter((r) => youTubeId(r.url)).length,
    recipes: recipes.length,
    workouts: workouts.length,
    courseDays: COURSE.length_days,
  }
  const doors = libraryModules()

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-serif text-[29px] font-semibold leading-[1.1]">Library</h1>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">everything outside the course, kept apart so it stays findable.</p>
      </div>

      <div className="flex flex-col gap-3">
        {doors.map((d) => {
          const Icon = d.icon
          const pillar = d.pillar ?? 'mindset'
          return (
            <Link key={d.key} href={d.href} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                style={{ backgroundColor: `color-mix(in oklch, var(--pillar-${pillar}), transparent 86%)` }}
              >
                <Icon className="h-5 w-5" style={{ color: `var(--pillar-${pillar})` }} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-serif text-[19px] font-semibold">{d.title}</span>
                <span className="mt-0.5 block text-[13.5px] text-muted-foreground text-pretty">{d.blurb}</span>
              </span>
              {d.count && <span className="shrink-0 text-xs font-medium text-muted-foreground">{d.count(counts)}</span>}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
