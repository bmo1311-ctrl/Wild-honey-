import { AddGroceryListForm, AddMealPlanForm, AddWorkoutForm } from '@/components/admin/workouts-forms'
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
      <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
        {workouts.length} workout{workouts.length === 1 ? '' : 's'} posted
      </div>

      <AddMealPlanForm />
      <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
        {mealPlans.length} meal plan{mealPlans.length === 1 ? '' : 's'} posted
      </div>

      <AddGroceryListForm />
      <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
        {groceryLists.length} grocery list{groceryLists.length === 1 ? '' : 's'} posted
      </div>
    </div>
  )
}
