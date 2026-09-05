import { redirect } from 'next/navigation'

/** Recipes moved into Nutrition, alongside meal plans, grocery and pantry. */
export default function RecipesRedirect() {
  redirect('/app/nutrition')
}
