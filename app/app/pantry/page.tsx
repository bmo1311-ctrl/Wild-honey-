import { redirect } from 'next/navigation'

/** Pantry and grocery moved into Nutrition. */
export default function PantryRedirect() {
  redirect('/app/nutrition')
}
