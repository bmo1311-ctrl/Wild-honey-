'use client'

import { useState } from 'react'
import { Bookmark } from 'lucide-react'
import { RecipeCard } from '@/components/recipe-card'
import type { Pillar, Recipe } from '@/lib/types'
import { PILLARS } from '@/lib/pillars'
import { cn } from '@/lib/utils'

export function RecipeBrowser({ recipes }: { recipes: Recipe[] }) {
  const [pillarFilter, setPillarFilter] = useState<Pillar | null>(null)
  const [savedOnly, setSavedOnly] = useState(false)

  const filtered = recipes.filter((r) => (!pillarFilter || r.pillar === pillarFilter) && (!savedOnly || r.saved))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setPillarFilter(null)}
          className={cn(
            'rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-border transition-colors',
            !pillarFilter ? 'bg-foreground text-background ring-foreground' : 'bg-transparent text-muted-foreground',
          )}
        >
          all
        </button>
        {PILLARS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPillarFilter(pillarFilter === p ? null : p)}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-border transition-colors',
              pillarFilter === p ? 'bg-foreground text-background ring-foreground' : 'bg-transparent text-muted-foreground',
            )}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setSavedOnly((s) => !s)}
          className={cn(
            'flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-border transition-colors',
            savedOnly ? 'bg-honey text-honey-foreground ring-honey' : 'bg-transparent text-muted-foreground',
          )}
        >
          <Bookmark className="h-3 w-3" />
          saved
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground ring-1 ring-border">
          {savedOnly ? "you haven't saved anything yet." : 'nothing here yet — check back soon.'}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((r) => (
            <RecipeCard key={r.id} recipe={r} />
          ))}
        </div>
      )}
    </div>
  )
}
