'use client'

import { useRouter } from 'next/navigation'
import { FoodLogger, type UsualFood } from '@/components/food-logger'
import type { FoodItem } from '@/lib/types'

/** Holds which person is being logged for and reloads their day on switch. */
export function FoodLogScreen({
  foods,
  logged,
  usual,
  members,
  memberId,
}: {
  foods: FoodItem[]
  logged: { id: string; name: string; quantity: number | null; unit: string | null; calories: number; protein: number }[]
  usual: UsualFood[]
  members: { id: string; name: string; is_self: boolean }[]
  memberId: string | null
}) {
  const router = useRouter()
  return (
    <FoodLogger
      foods={foods}
      logged={logged}
      usual={usual}
      members={members}
      memberId={memberId}
      onSwitchMember={(id) => router.push(id ? `/app/nutrition/log?member=${id}` : '/app/nutrition/log')}
    />
  )
}
