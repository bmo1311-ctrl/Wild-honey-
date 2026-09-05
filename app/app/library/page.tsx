import Link from 'next/link'
import { ChefHat, Dumbbell, Play } from 'lucide-react'
import { getRecipes, getResources, getWorkouts } from '@/lib/data'
import { youTubeId } from '@/lib/youtube'

/** Three doors, not one drawer. Each area has its own filters inside. */
export default async function LibraryPage() {
  const [resources, recipes, workouts] = await Promise.all([getResources(), getRecipes(), getWorkouts()])
  const videoCount = resources.filter((r) => youTubeId(r.url)).length

  const doors = [
    {
      href: '/app/vault',
      icon: Play,
      title: 'Watch',
      blurb: 'teaching on identity, mindset and faith',
      count: `${videoCount} videos`,
      pillar: 'mindset',
    },
    {
      href: '/app/nutrition',
      icon: ChefHat,
      title: 'Nutrition',
      blurb: 'recipes, meal plans, grocery and pantry',
      count: `${recipes.length} recipes`,
      pillar: 'body',
    },
    {
      href: '/app/fitness',
      icon: Dumbbell,
      title: 'Fitness',
      blurb: 'strength, cardio and mobility',
      count: `${workouts.length} workouts`,
      pillar: 'identity',
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-serif text-[29px] font-semibold leading-[1.1]">Library</h1>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">everything outside the course, kept apart so it stays findable.</p>
      </div>

      <div className="flex flex-col gap-3">
        {doors.map((d) => {
          const Icon = d.icon
          return (
            <Link key={d.href} href={d.href} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                style={{ backgroundColor: `color-mix(in oklch, var(--pillar-${d.pillar}), transparent 86%)` }}
              >
                <Icon className="h-5 w-5" style={{ color: `var(--pillar-${d.pillar})` }} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-serif text-[19px] font-semibold">{d.title}</span>
                <span className="mt-0.5 block text-[13.5px] text-muted-foreground text-pretty">{d.blurb}</span>
              </span>
              <span className="shrink-0 text-xs font-medium text-muted-foreground">{d.count}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
