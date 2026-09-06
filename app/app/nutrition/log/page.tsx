import Link from 'next/link'
import { ChevronLeft, Settings2 } from 'lucide-react'
import { FoodLogScreen } from '@/components/food-log-screen'
import { getCurrentCyclePhase, getFoodItems, getHouseholdMembers, getOwnerScope, getSavedMeals, getSessionProfile, getTodayNutrition, getUsualFoods } from '@/lib/data'
import { phaseLabel } from '@/lib/cycle'
import { ownerTargets } from '@/lib/targets'
import { NutrientRings } from '@/components/nutrient-rings'
import { NutrientPanel } from '@/components/nutrient-panel'
import { ageFromBirthYear, driFor, type Sex } from '@/lib/dri'

/**
 * One job: log what she ate. No recipes, no browsing — she tapped "log what
 * you ate" and this is that, and only that.
 */
export default async function LogFoodPage({ searchParams }: { searchParams: Promise<{ member?: string }> }) {
  const { member } = await searchParams
  const scope = await getOwnerScope()
  const members = scope?.childMemberId ? [] : await getHouseholdMembers()
  const self = members.find((m) => m.is_self)
  // null means the account holder; anyone else is logged against their id.
  const memberId = scope?.childMemberId ?? (member && member !== self?.id && members.some((m) => m.id === member) ? member : null)
  const [foods, nutrition, usual, profile, loggedPhase, savedMeals] = await Promise.all([
    getFoodItems(),
    getTodayNutrition(memberId),
    getUsualFoods(8, memberId),
    getSessionProfile(),
    getCurrentCyclePhase(),
    getSavedMeals(memberId),
  ])

  const { cycled, phase, hasGoals, birthYear } = ownerTargets(profile, loggedPhase)

  // Whoever is selected gets their own reference intakes. For her, the
  // calculated macro targets override the generic adult figures.
  const selected = members.find((m) => (memberId ? m.id === memberId : m.is_self))
  const selectedAge = memberId
    ? ageFromBirthYear(selected?.birth_year ?? null)
    : ageFromBirthYear(birthYear)
  const selectedSex: Sex | null = memberId ? ((selected as { sex?: Sex | null })?.sex ?? null) : 'female'
  const reference = driFor(selectedAge, selectedSex) ?? {}
  const panelTargets = memberId ? reference : { ...reference, ...cycled.targets }

  const note = memberId
    ? `General reference intakes for ${selectedAge ? `age ${selectedAge}` : 'this age'}, not a prescription. Children's needs vary with growth and activity — anything specific belongs with their doctor.`
    : 'Micronutrient figures are general adult reference intakes. Your calorie and protein targets come from your own weight and goal.'

  const logged = nutrition.loggedMeals.map((m) => {
    const row = m as typeof m & {
      custom_name?: string | null
      quantity?: number | null
      unit?: string | null
      calories?: number | null
      protein_g?: number | null
      group_id?: string | null
      meal_name?: string | null
    }
    return {
      id: m.id,
      groupId: row.group_id ?? null,
      mealName: row.meal_name ?? null,
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

      {phase && !memberId && (
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-faith-pillar" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-semibold">{phaseLabel(phase)} phase</span>
            <span className="block text-[13px] text-muted-foreground">
              {cycled.pct === 0
                ? 'targets unchanged this week'
                : `${cycled.pct > 0 ? '+' : ''}${cycled.pct}% on calories and carbs today`}
            </span>
          </span>
          <Link href="/app/nutrition/goals" className="shrink-0 text-[13px] font-medium text-mindset-pillar underline underline-offset-[3px]">
            adjust
          </Link>
        </div>
      )}

      <NutrientRings
        totals={{
          calories: nutrition.calories,
          protein_g: nutrition.protein,
          carbs_g: nutrition.carbs,
          fat_g: nutrition.fat,
        }}
        targets={cycled.targets}
        hasGoals={hasGoals && !memberId}
      />

      <NutrientPanel totals={nutrition.nutrients} targets={panelTargets} note={note} />

      <FoodLogScreen
        foods={foods}
        logged={logged}
        usual={usual}
        members={members.map((m) => ({ id: m.id, name: m.name, is_self: m.is_self }))}
        memberId={memberId}
        savedMeals={savedMeals}
      />

      <Link href="/app/nutrition" className="text-center text-sm font-medium text-mindset-pillar underline underline-offset-[3px]">
        Browse recipes instead
      </Link>
    </div>
  )
}
