import { redirect } from 'next/navigation'

/** Workouts moved to Fitness; its meal plans and grocery lists moved to Nutrition. */
export default function WorkoutsRedirect() {
  redirect('/app/fitness')
}
