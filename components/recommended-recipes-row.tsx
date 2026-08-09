'use client'

import { useMemo } from 'react'
import { Row, shuffle } from '@/components/pillar-rows'
import { RecipeCard } from '@/components/recipe-card'
import type { CyclePhase, Recipe } from '@/lib/types'

const CYCLE_LABEL: Record<string, string> = {
  menstrual: 'your menstrual phase',
  follicular: 'your follicular phase',
  ovulation: 'your ovulation phase',
  luteal: 'your luteal phase',
}

export function RecommendedRecipesRow({
  recipes,
  season,
  cyclePhase,
}: {
  recipes: Recipe[]
  season: string
  cyclePhase: CyclePhase | null
}) {
  const shuffled = useMemo(() => shuffle(recipes), [recipes])
  if (shuffled.length === 0) return null

  const label = cyclePhase && CYCLE_LABEL[cyclePhase] ? `picked for ${season} + ${CYCLE_LABEL[cyclePhase]}` : `picked for ${season}`

  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-honey/10 p-4 ring-1 ring-honey/20">
      <Row label={label} items={shuffled} renderItem={(r) => <RecipeCard recipe={r} />} cardWidthClass="w-[260px]" />
      {!cyclePhase && (
        <p className="text-[0.7rem] text-muted-foreground">
          log your cycle phase in today's check-in and these get even more specific.
        </p>
      )}
    </div>
  )
}
