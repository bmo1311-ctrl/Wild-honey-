import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { FoodLogger } from '@/components/food-logger'
import { getFoodItems, getTodayNutrition } from '@/lib/data'

/**
 * One job: log what she ate. No recipes, no browsing — she tapped "log what
 * you ate" and this is that, and only that.
 */
export default async function LogFoodPage() {
  const [foods, nutrition] = await Promise.all([getFoodItems(), getTodayNutrition()])

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

  const totals = [
    { label: 'cal', value: Math.round(nutrition.calories), goal: nutrition.calorieGoal },
    { label: 'protein', value: Math.round(nutrition.protein), goal: nutrition.proteinGoal },
    { label: 'carbs', value: Math.round(nutrition.carbs), goal: null },
    { label: 'fat', value: Math.round(nutrition.fat), goal: null },
  ]

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link href="/app" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ChevronLeft className="h-4 w-4" /> Today
        </Link>
        <h1 className="font-serif text-[29px] font-semibold leading-[1.1]">Log what you ate</h1>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {totals.map((t) => (
          <div key={t.label} className="rounded-2xl border border-border bg-card px-2 py-3 text-center">
            <p className="font-serif text-[22px] font-semibold leading-none">{t.value}</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
              {t.goal ? `of ${t.goal}` : t.label}
            </p>
          </div>
        ))}
      </div>

      <FoodLogger foods={foods} logged={logged} />

      <Link href="/app/nutrition" className="text-center text-sm font-medium text-mindset-pillar underline underline-offset-[3px]">
        Browse recipes instead
      </Link>
    </div>
  )
}
