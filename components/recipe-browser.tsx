'use client'

import { Bookmark } from 'lucide-react'
import { RecipeCard } from '@/components/recipe-card'
import { PillarRows } from '@/components/pillar-rows'
import type { Recipe } from '@/lib/types'

export function RecipeBrowser({ recipes }: { recipes: Recipe[] }) {
  return (
    <PillarRows
      items={recipes}
      cardWidthClass="w-[260px]"
      renderItem={(r) => <RecipeCard recipe={r} />}
      extraFilter={{
        label: 'saved',
        icon: <Bookmark className="h-3 w-3" />,
        predicate: (r) => Boolean(r.saved),
      }}
    />
  )
}
