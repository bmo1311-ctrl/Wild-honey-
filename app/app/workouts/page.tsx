import { getGroceryLists, getMealPlans, getSessionProfile, getWorkouts, hasPaidAccess } from '@/lib/data'
import { WorkoutsHubTabs } from '@/components/workouts-hub-tabs'

export default async function WorkoutsPage() {
  const [workouts, mealPlans, groceryLists, profile] = await Promise.all([
    getWorkouts(),
    getMealPlans(),
    getGroceryLists(),
    getSessionProfile(),
  ])
  const unlocked = hasPaidAccess(profile?.membership_tier)

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Workouts</h1>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">
          movement, meal plans, and grocery lists to support the Body pillar.
        </p>
      </div>
      <WorkoutsHubTabs workouts={workouts} mealPlans={mealPlans} groceryLists={groceryLists} unlocked={unlocked} />
    </div>
  )
}
