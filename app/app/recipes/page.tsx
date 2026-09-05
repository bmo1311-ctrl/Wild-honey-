import { RecipeFilterBar } from '@/components/recipe-filter-bar'
import { RecommendedRecipesRow } from '@/components/recommended-recipes-row'
import { NutritionSummary } from '@/components/nutrition-summary'
import { getCurrentCyclePhase, getCurrentSeason, getRecipes, getRecommendedRecipes, getTodayNutrition } from '@/lib/data'
import { FeatureOff } from '@/components/feature-off'
import { FEATURES } from '@/lib/features'

export default async function RecipesPage() {
  if (!FEATURES.recipes) return <FeatureOff />

  const [recipes, recommended, season, cyclePhase, nutrition] = await Promise.all([
    getRecipes(),
    getRecommendedRecipes(),
    Promise.resolve(getCurrentSeason()),
    getCurrentCyclePhase(),
    getTodayNutrition(),
  ])

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Recipes</h1>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">nourishment made simple — filter by meal, cycle phase, season, budget, or time.</p>
      </div>

      <NutritionSummary
        calories={nutrition.calories}
        protein={nutrition.protein}
        carbs={nutrition.carbs}
        fat={nutrition.fat}
        calorieGoal={nutrition.calorieGoal}
        proteinGoal={nutrition.proteinGoal}
        loggedMeals={nutrition.loggedMeals}
      />

      <RecommendedRecipesRow recipes={recommended} season={season} cyclePhase={cyclePhase} />

      <RecipeFilterBar recipes={recipes} />
    </div>
  )
}
