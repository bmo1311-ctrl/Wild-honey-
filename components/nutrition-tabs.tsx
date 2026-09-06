'use client'

import { useState } from 'react'
import type React from 'react'
import { cn } from '@/lib/utils'

const TABS = [
  { id: 'recipes', label: 'Recipes' },
  { id: 'plans', label: 'Meal plans' },
  { id: 'grocery', label: 'Grocery' },
  { id: 'pantry', label: 'Pantry' },
  { id: 'cook', label: 'Cook' },
] as const

type TabId = (typeof TABS)[number]['id']

/** Everything food, in one place, with tabs — instead of spread over three pages. */
export function NutritionTabs({
  counts,
  recipes,
  plans,
  grocery,
  pantry,
  cook,
}: {
  counts: Partial<Record<TabId, number>>
  recipes: React.ReactNode
  plans: React.ReactNode
  grocery: React.ReactNode
  pantry: React.ReactNode
  cook: React.ReactNode
}) {
  const [active, setActive] = useState<TabId>('recipes')
  const panes: Record<TabId, React.ReactNode> = { recipes, plans, grocery, pantry, cook }

  return (
    <div className="flex flex-col gap-4">
      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActive(t.id)}
            className={cn(
              'shrink-0 rounded-full px-3.5 py-2 text-sm font-medium transition-colors',
              active === t.id ? 'bg-mindset-pillar text-white' : 'bg-muted text-muted-foreground',
            )}
          >
            {t.label}
            {counts[t.id] !== undefined && <span className="ml-1.5 opacity-70">{counts[t.id]}</span>}
          </button>
        ))}
      </div>
      {panes[active]}
    </div>
  )
}
