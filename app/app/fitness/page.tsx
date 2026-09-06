import { WorkoutFilterBar } from '@/components/workout-filter-bar'
import { Locked } from '@/components/locked'
import { getAccess, getWorkouts } from '@/lib/data'

/** Movement only. Meal plans and grocery lists moved to Nutrition. */
export default async function FitnessPage() {
  const [workouts, access] = await Promise.all([getWorkouts(), getAccess()])
  const unlocked = access.paid

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-serif text-[29px] font-semibold leading-[1.1]">Fitness</h1>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">strength, cardio and mobility — filter by type or body group.</p>
      </div>
      {unlocked ? (
        <WorkoutFilterBar workouts={workouts} />
      ) : (
        <Locked blurb="Every workout — strength, cardio and mobility, filtered by type or body group. Part of The Circle." from="fitness" />
      )}
    </div>
  )
}
