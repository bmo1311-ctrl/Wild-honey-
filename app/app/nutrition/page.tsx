import { RecipeSources } from '@/components/recipe-sources'
import { RecipeImport } from '@/components/recipe-import'
import { RecommendedRecipesRow } from '@/components/recommended-recipes-row'
import { TodayNutrition } from '@/components/today-nutrition'
import { ownerTargets } from '@/lib/targets'
import { ageFromBirthYear, driFor } from '@/lib/dri'
import { NutritionTabs } from '@/components/nutrition-tabs'
import { GroceryBuilder } from '@/components/grocery-builder'
import { PantryList } from '@/components/pantry-list'
import { MealPlanList } from '@/components/meal-plan-list'
import {
  getCurrentCyclePhase,
  getCurrentSeason,
  getGroceryBuilderItems,
  getMealPlans,
  getPantryItems,
  getRecipes,
  getRecommendedRecipes,
  getSessionProfile,
  getTodayNutrition,
  hasPaidAccess,
} from '@/lib/data'
import { FeatureOff } from '@/components/feature-off'
import { FEATURES } from '@/lib/features'

/** One home for food: recipes, meal plans, grocery and pantry. */
export default async function NutritionPage() {
  if (!FEATURES.recipes) return <FeatureOff />

  const [recipes, recommended, season, cyclePhase, nutrition, plans, grocery, pantry, profile] = await Promise.all([
    getRecipes(),
    getRecommendedRecipes(),
    Promise.resolve(getCurrentSeason()),
    getCurrentCyclePhase(),
    getTodayNutrition(),
    getMealPlans(),
    getGroceryBuilderItems(),
    getPantryItems(),
    getSessionProfile(),
  ])
  const unlocked = hasPaidAccess(profile?.membership_tier)
  const own = ownerTargets(profile, cyclePhase)
  const panelTargets = { ...(driFor(ageFromBirthYear(own.birthYear), 'female') ?? {}), ...own.cycled.targets }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-serif text-[29px] font-semibold leading-[1.1]">Nutrition</h1>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">what you eat, what you&rsquo;re buying, what&rsquo;s in the cupboard.</p>
      </div>

      <TodayNutrition
        totals={{ calories: nutrition.calories, protein_g: nutrition.protein, carbs_g: nutrition.carbs, fat_g: nutrition.fat }}
        nutrients={nutrition.nutrients}
        targets={own.cycled.targets}
        panelTargets={panelTargets}
        hasGoals={own.hasGoals}
        loggedMeals={nutrition.loggedMeals}
      />

      <NutritionTabs
        counts={{ recipes: recipes.length, plans: plans.length, grocery: grocery.length, pantry: pantry.length }}
        recipes={
          <div className="flex flex-col gap-6">
            <RecipeImport />
            <RecommendedRecipesRow recipes={recommended} season={season} cyclePhase={cyclePhase} />
            <RecipeSources recipes={recipes} userId={profile?.id ?? null} />
          </div>
        }
        plans={<MealPlanList plans={plans} unlocked={unlocked} />}
        grocery={<GroceryBuilder items={grocery} />}
        pantry={<PantryList items={pantry} />}
      />
    </div>
  )
}
