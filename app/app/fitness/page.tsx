import { WorkoutFilterBar } from '@/components/workout-filter-bar'
import { getSessionProfile, getWorkouts, hasPaidAccess } from '@/lib/data'

/** Movement only. Meal plans and grocery lists moved to Nutrition. */
export default async function FitnessPage() {
  const [workouts, profile] = await Promise.all([getWorkouts(), getSessionProfile()])
  const unlocked = hasPaidAccess(profile?.membership_tier)

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-serif text-[29px] font-semibold leading-[1.1]">Fitness</h1>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">strength, cardio and mobility — filter by type or body group.</p>
      </div>
      {unlocked ? (
        <WorkoutFilterBar workouts={workouts} />
      ) : (
        <p className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground ring-1 ring-border">
          workouts are part of a paid membership.
        </p>
      )}
    </div>
  )
}
