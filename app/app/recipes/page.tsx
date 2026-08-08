import { RecipeBrowser } from '@/components/recipe-browser'
import { getRecipes } from '@/lib/data'

export default async function RecipesPage() {
  const recipes = await getRecipes()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Recipes</h1>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">nourishment made simple — filter by pillar or save your favorites.</p>
      </div>
      <RecipeBrowser recipes={recipes} />
    </div>
  )
}
