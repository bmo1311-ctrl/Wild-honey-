import Link from 'next/link'
import { ChevronLeft, Settings2 } from 'lucide-react'
import { FoodLogger } from '@/components/food-logger'
import { getFoodItems, getSessionProfile, getTodayNutrition, getUsualFoods } from '@/lib/data'
import { NutrientRings } from '@/components/nutrient-rings'
import { calculateTargets, effectiveTargets, type ActivityLevel, type BodyGoal } from '@/lib/goals'

/**
 * One job: log what she ate. No recipes, no browsing — she tapped "log what
 * you ate" and this is that, and only that.
 */
export default async function LogFoodPage() {
  const [foods, nutrition, usual, profile] = await Promise.all([
    getFoodItems(),
    getTodayNutrition(),
    getUsualFoods(),
    getSessionProfile(),
  ])

  const p = profile as (typeof profile & {
    weight_kg?: number | null
    height_cm?: number | null
    birth_year?: number | null
    activity_level?: string | null
    body_goal?: string | null
  }) | null

  const calculated = calculateTargets({
    weightKg: p?.weight_kg ?? null,
    heightCm: p?.height_cm ?? null,
    birthYear: p?.birth_year ?? null,
    activity: (p?.activity_level as ActivityLevel) ?? null,
    goal: (p?.body_goal as BodyGoal) ?? null,
  })
  const targets = effectiveTargets(calculated, {
    ...(profile?.daily_calorie_goal ? { calories: profile.daily_calorie_goal } : {}),
    ...(profile?.daily_protein_goal_g ? { protein_g: profile.daily_protein_goal_g } : {}),
  })
  const hasGoals = Boolean(p?.weight_kg)

  const logged = nutrition.loggedMeals.map((m) => {
    const row = m as typeof m & {
      custom_name?: string | null
      quantity?: number | null
      unit?: string | null
      calories?: number | null
      protein_g?: number | null
    }
    return {
      id: m.id,
      name: row.custom_name ?? m.recipe?.title ?? 'meal',
      quantity: row.quantity ?? null,
      unit: row.unit ?? null,
      calories: row.calories ?? (m.recipe?.calories ?? 0) * (m.servings || 1),
      protein: row.protein_g ?? (m.recipe?.protein_g ?? 0) * (m.servings || 1),
    }
  })

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link href="/app" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ChevronLeft className="h-4 w-4" /> Today
        </Link>
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-serif text-[29px] font-semibold leading-[1.1]">Log what you ate</h1>
          <Link href="/app/nutrition/goals" aria-label="Your targets" className="shrink-0 rounded-full bg-card p-2.5 ring-1 ring-border">
            <Settings2 className="h-4 w-4 text-muted-foreground" />
          </Link>
        </div>
      </div>

      <NutrientRings
        totals={{
          calories: nutrition.calories,
          protein_g: nutrition.protein,
          carbs_g: nutrition.carbs,
          fat_g: nutrition.fat,
        }}
        targets={targets}
        hasGoals={hasGoals}
      />

      <FoodLogger foods={foods} logged={logged} usual={usual} />

      <Link href="/app/nutrition" className="text-center text-sm font-medium text-mindset-pillar underline underline-offset-[3px]">
        Browse recipes instead
      </Link>
    </div>
  )
}
