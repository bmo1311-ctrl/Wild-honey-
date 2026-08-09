import { RecipeFilterBar } from '@/components/recipe-filter-bar'
import { RecommendedRecipesRow } from '@/components/recommended-recipes-row'
import { getCurrentCyclePhase, getCurrentSeason, getRecipes, getRecommendedRecipes } from '@/lib/data'

export default async function RecipesPage() {
  const [recipes, recommended, season, cyclePhase] = await Promise.all([
    getRecipes(),
    getRecommendedRecipes(),
    Promise.resolve(getCurrentSeason()),
    getCurrentCyclePhase(),
  ])

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Recipes</h1>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">nourishment made simple — filter by meal, cycle phase, season, budget, or time.</p>
      </div>

      <RecommendedRecipesRow recipes={recommended} season={season} cyclePhase={cyclePhase} />

      <RecipeFilterBar recipes={recipes} />
    </div>
  )
}
