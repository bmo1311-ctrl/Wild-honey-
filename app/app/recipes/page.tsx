import { RecipeBrowser } from '@/components/recipe-browser'
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
        <p className="mt-1 text-sm text-muted-foreground text-pretty">nourishment made simple — filter by pillar or save your favorites.</p>
      </div>

      <RecommendedRecipesRow recipes={recommended} season={season} cyclePhase={cyclePhase} />

      <RecipeBrowser recipes={recipes} />
    </div>
  )
}
