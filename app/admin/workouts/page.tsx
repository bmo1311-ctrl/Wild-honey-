import { AddGroceryListForm, AddMealPlanForm, AddWorkoutForm } from '@/components/admin/workouts-forms'
import { WorkoutRow } from '@/components/admin/workout-row'
import { MealPlanRow } from '@/components/admin/meal-plan-row'
import { GroceryListRow } from '@/components/admin/grocery-list-row'
import { getGroceryLists, getMealPlans, getWorkouts } from '@/lib/data'

export default async function AdminWorkoutsPage() {
  const [workouts, mealPlans, groceryLists] = await Promise.all([getWorkouts(), getMealPlans(), getGroceryLists()])

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Workouts Hub</h1>
        <p className="mt-1 text-sm text-muted-foreground">manage workouts, meal plans, and grocery lists shown to paid members.</p>
      </div>

      <AddWorkoutForm />
      <div className="flex flex-col gap-2">
        {workouts.map((w) => (
          <WorkoutRow key={w.id} workout={w} />
        ))}
      </div>

      <AddMealPlanForm />
      <div className="flex flex-col gap-2">
        {mealPlans.map((m) => (
          <MealPlanRow key={m.id} mealPlan={m} />
        ))}
      </div>

      <AddGroceryListForm />
      <div className="flex flex-col gap-2">
        {groceryLists.map((g) => (
          <GroceryListRow key={g.id} groceryList={g} />
        ))}
      </div>
    </div>
  )
}
