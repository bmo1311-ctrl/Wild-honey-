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
      /*
       * Keyed on whose board this is.
       *
       * `LearningBoard` seeds `done` from `items` in a useState, and switching
       * member is a `router.push` — same component, new props, no remount. So
       * the tick map stayed on the previous child: every one of the new
       * child's items rendered unticked, "n done today" read 0, and tapping
       * an item that was already complete sent a toggle that *deleted* the
       * completion. A parent checking on one child could silently un-finish
       * another child's work.
       */
      key={activeId ?? 'self'}
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
