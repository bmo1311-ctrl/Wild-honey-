'use client'

import { useRouter } from 'next/navigation'
import { FoodLogger, type UsualFood } from '@/components/food-logger'
import type { FoodItem } from '@/lib/types'
import type { SavedMeal } from '@/lib/data'

/** Holds which person is being logged for and reloads their day on switch. */
export function FoodLogScreen({
  foods,
  logged,
  usual,
  members,
  memberId,
  savedMeals,
}: {
  foods: FoodItem[]
  logged: { id: string; groupId?: string | null; mealName?: string | null; name: string; quantity: number | null; unit: string | null; calories: number; protein: number }[]
  usual: UsualFood[]
  members: { id: string; name: string; is_self: boolean }[]
  memberId: string | null
  savedMeals?: SavedMeal[]
}) {
  const router = useRouter()
  return (
    <FoodLogger
      foods={foods}
      logged={logged}
      usual={usual}
      members={members}
      memberId={memberId}
      savedMeals={savedMeals}
      onSwitchMember={(id) => router.push(id ? `/app/nutrition/log?member=${id}` : '/app/nutrition/log')}
    />
  )
}
