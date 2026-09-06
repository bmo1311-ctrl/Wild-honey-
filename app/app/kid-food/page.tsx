import { KidFood, type KidFoodItem } from '@/components/kid-food'
import { getFoodItems, getOwnerScope, getTodayNutrition, getUsualFoods } from '@/lib/data'

const slim = (f: { id: string; name: string; serving_size: number; serving_unit: string }): KidFoodItem => ({
  id: f.id,
  name: f.name,
  serving_size: f.serving_size,
  serving_unit: f.serving_unit,
})

/** Her food, her way: tap what you ate, tap the water, collect the stars. */
export default async function KidFoodPage() {
  const scope = await getOwnerScope()
  if (!scope?.childMemberId) return null
  const memberId = scope.childMemberId
  const [foods, usual, nutrition] = await Promise.all([getFoodItems(), getUsualFoods(8, memberId), getTodayNutrition(memberId)])
  const water = foods.find((f) => f.user_id === null && f.name.toLowerCase() === 'water') ?? null
  const glasses = water ? Math.round((nutrition.nutrients.water_ml ?? 0) / water.serving_size) : 0
  const today = nutrition.loggedMeals
    .map((m) => (m as typeof m & { custom_name?: string | null }).custom_name ?? m.recipe?.title ?? 'meal')
    .filter((n) => n.toLowerCase() !== 'water')

  return (
    <div className="flex flex-col gap-5">
      <header className="honey-glow -mx-5 -mt-6 px-5 pb-5 pt-8">
        <h1 className="font-serif text-[32px] font-semibold leading-[1.1]">Food</h1>
        <p className="mt-1.5 text-[17px] text-muted-foreground">Tell me what you ate. Every one gets a star.</p>
      </header>
      <KidFood
        usual={usual.filter((u) => u.food.name.toLowerCase() !== 'water').map((u) => ({ food: slim(u.food), quantity: u.lastQuantity }))}
        foods={foods.map(slim)}
        water={water ? slim(water) : null}
        glasses={glasses}
        today={today}
      />
    </div>
  )
}
