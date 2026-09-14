import { RecipeSources } from '@/components/recipe-sources'
import { RecipeImport } from '@/components/recipe-import'
import { RecommendedRecipesRow } from '@/components/recommended-recipes-row'
import { TodayNutrition } from '@/components/today-nutrition'
import { LifeStageFocus } from '@/components/life-stage-focus'
import { ownerTargets } from '@/lib/targets'
import { ageFromBirthYear, driFor, driForStage } from '@/lib/dri'
import { NutritionTabs } from '@/components/nutrition-tabs'
import { ResourceShelf } from '@/components/resource-vault'
import { GroceryBuilder } from '@/components/grocery-builder'
import { PantryList } from '@/components/pantry-list'
import { MealPlanList } from '@/components/meal-plan-list'
import {
  getCyclePhase,
  getCurrentSeason,
  getGroceryBuilderItems,
  getFoodItems,
  getMealPlans,
  getPantryItems,
  getRecipes,
  getRecommendedRecipes,
  getResources,
  getSessionProfile,
  getTodayNutrition,
  getAccess,
} from '@/lib/data'
import { FeatureOff } from '@/components/feature-off'
import { Locked } from '@/components/locked'
import { FEATURES } from '@/lib/features'
import { adultsOnly } from '@/lib/kid-guard'

/** One home for food: recipes, meal plans, grocery, pantry and short cooking videos. */
export default async function NutritionPage() {
  await adultsOnly()
  if (!FEATURES.recipes) return <FeatureOff />

  const [recipes, recommended, season, cycle, nutrition, plans, grocery, foods, pantry, profile, allResources] = await Promise.all([
    getRecipes(),
    getRecommendedRecipes(),
    Promise.resolve(getCurrentSeason()),
    getCyclePhase(),
    getTodayNutrition(),
    getMealPlans(),
    getGroceryBuilderItems(),
    getFoodItems(),
    getPantryItems(),
    getSessionProfile(),
    getResources(),
  ])
  // 407 names, filtered client-side. Passing whole food rows would ship the
  // full nutrient table for every one of them to the browser for no reason.
  const foodNames = foods.map((f) => f.name)
  const cookVideos = allResources.filter((r) => r.collection === 'nourish')
  const unlocked = (await getAccess()).paid
  const own = ownerTargets(profile, cycle.phase)
  /*
   * Her stage's reference figures, not the general adult ones.
   *
   * This read `driFor(...)` — the adult female band — while `life_stage` was
   * read two lines below for the focus card. So a pregnant member saw iron
   * "/ 18" here and "of 27" in the card directly underneath, and caffeine
   * against 400mg, which is roughly double the figure usually cited in
   * pregnancy. Same nutrient, same screen, two numbers.
   */
  const panelTargets = {
    ...(driForStage(ageFromBirthYear(own.birthYear), 'female', profile?.life_stage as never) ?? {}),
    ...own.cycled.targets,
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-serif text-[29px] font-semibold leading-[1.1]">Nourish</h1>
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

      {/*
        She told us she is trying, or pregnant, or feeding — and until now
        that changed nothing but a skincare warning. The folate and iron were
        already being counted.
      */}
      <LifeStageFocus stage={profile?.life_stage ?? null} totals={nutrition.nutrients as Record<string, number>} />

      <NutritionTabs
        counts={{ recipes: recipes.length, plans: plans.length, grocery: grocery.length, pantry: pantry.length, cook: cookVideos.length }}
        recipes={
          unlocked ? (
            <div className="flex flex-col gap-6">
              <RecipeImport />
              <RecommendedRecipesRow recipes={recommended} season={season} cyclePhase={cycle.phase} />
              <RecipeSources recipes={recipes} userId={profile?.id ?? null} />
            </div>
          ) : (
            <Locked blurb="Sixty recipes, any recipe from a link, and picks for your season and cycle. Part of The Circle." from="nutrition" compact />
          )
        }
        plans={<MealPlanList plans={plans} unlocked={unlocked} />}
        grocery={unlocked ? <GroceryBuilder items={grocery} foodNames={foodNames} /> : <Locked blurb="A grocery list that builds itself from what you plan to cook. Part of The Circle." from="nutrition" compact />}
        pantry={unlocked ? <PantryList items={pantry} foodNames={foodNames} /> : <Locked blurb="What is in the cupboard, so meals start from there. Part of The Circle." from="nutrition" compact />}
        cook={
          unlocked ? (
            <ResourceShelf resources={cookVideos} empty="no cooking videos yet." />
          ) : (
            <Locked blurb="Short cooking videos — high protein, quick, real. Part of The Circle." from="nutrition" compact />
          )
        }
      />
    </div>
  )
}
