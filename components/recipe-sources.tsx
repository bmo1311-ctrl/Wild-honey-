'use client'

import { useState } from 'react'
import { RecipeFilterBar } from '@/components/recipe-filter-bar'
import type { Recipe } from '@/lib/types'
import { cn } from '@/lib/utils'

/** Whose recipes: the official set, hers, or what other members shared. */
export function RecipeSources({ recipes, userId }: { recipes: Recipe[]; userId: string | null }) {
  const mine = recipes.filter((r) => r.user_id && r.user_id === userId)
  const circle = recipes.filter((r) => r.user_id && r.user_id !== userId && r.is_public)
  const official = recipes.filter((r) => !r.user_id)
  const tabs = [
    { key: 'official', label: 'Wild Honey', list: official },
    { key: 'mine', label: 'Mine', list: mine },
    { key: 'circle', label: 'From the circle', list: circle },
  ] as const
  const [tab, setTab] = useState<(typeof tabs)[number]['key']>('official')
  const current = tabs.find((t) => t.key === tab)!

  return (
    <div className="flex flex-col gap-3">
      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
        {tabs.map((t) => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)} className={cn('shrink-0 rounded-full px-3.5 py-2 text-sm font-medium transition-colors', tab === t.key ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground')}>
            {t.label} <span className="opacity-70">{t.list.length}</span>
          </button>
        ))}
      </div>
      {current.list.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-[15px] text-muted-foreground text-pretty">
          {tab === 'mine' ? 'Nothing here yet — add one from a link above.' : tab === 'circle' ? 'Nobody has shared a recipe yet. Yours could be first.' : 'No recipes.'}
        </p>
      ) : (
        <RecipeFilterBar recipes={current.list} />
      )}
    </div>
  )
}
