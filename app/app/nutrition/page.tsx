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
  getAccess,
} from '@/lib/data'
import { FeatureOff } from '@/components/feature-off'
import { Locked } from '@/components/locked'
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
  const unlocked = (await getAccess()).paid
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
          unlocked ? (
            <div className="flex flex-col gap-6">
              <RecipeImport />
              <RecommendedRecipesRow recipes={recommended} season={season} cyclePhase={cyclePhase} />
              <RecipeSources recipes={recipes} userId={profile?.id ?? null} />
            </div>
          ) : (
            <Locked blurb="Sixty recipes, any recipe from a link, and picks for your season and cycle. Part of The Circle." from="nutrition" compact />
          )
        }
        plans={<MealPlanList plans={plans} unlocked={unlocked} />}
        grocery={unlocked ? <GroceryBuilder items={grocery} /> : <Locked blurb="A grocery list that builds itself from what you plan to cook. Part of The Circle." from="nutrition" compact />}
        pantry={unlocked ? <PantryList items={pantry} /> : <Locked blurb="What is in the cupboard, so meals start from there. Part of The Circle." from="nutrition" compact />}
      />
    </div>
  )
}
