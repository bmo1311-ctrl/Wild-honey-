'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LearningBoard } from '@/components/learning-board'
import type { HouseholdMember, LearningItem } from '@/lib/types'

/** Holds which person is selected and asks the server for their list. */
export function LearningScreen({
  members,
  initialMemberId,
  items,
}: {
  members: HouseholdMember[]
  initialMemberId: string | null
  items: LearningItem[]
}) {
  const [activeId, setActiveId] = useState(initialMemberId)
  const router = useRouter()

  return (
    <LearningBoard
      members={members}
      activeMemberId={activeId}
      items={items}
      onSwitch={(id) => {
        setActiveId(id)
        router.push(`/app/learning?member=${id}`)
      }}
    />
  )
}
