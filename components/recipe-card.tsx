'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Bookmark, Clock } from 'lucide-react'
import { toggleSavedRecipe } from '@/app/actions'
import type { Recipe } from '@/lib/types'
import { PILLAR_META } from '@/lib/pillars'
import { cn } from '@/lib/utils'

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  const [open, setOpen] = useState(false)
  const [saved, setSaved] = useState(Boolean(recipe.saved))
  const [pending, startTransition] = useTransition()

  function handleToggleSave() {
    const next = !saved
    setSaved(next)
    startTransition(async () => {
      const res = await toggleSavedRecipe(recipe.id)
      if (res?.error) {
        setSaved(!next)
        toast.error(res.error)
      }
    })
  }

  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-card p-4 ring-1 ring-border">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {recipe.pillar && <span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-medium ${PILLAR_META[recipe.pillar].chip}`}>{recipe.pillar}</span>}
          {recipe.prep_minutes && (
            <span className="flex items-center gap-1 text-[0.7rem] text-muted-foreground">
              <Clock className="h-3 w-3" />
              {recipe.prep_minutes} min
            </span>
          )}
        </div>
        <button type="button" onClick={handleToggleSave} disabled={pending} className={cn('shrink-0', saved ? 'text-honey' : 'text-muted-foreground/50')}>
          <Bookmark className={cn('h-4 w-4', saved && 'fill-current')} />
        </button>
      </div>
      <button type="button" onClick={() => setOpen((o) => !o)} className="text-left">
        <p className="font-serif text-base font-semibold text-pretty">{recipe.title}</p>
        {recipe.description && <p className="text-sm text-muted-foreground text-pretty">{recipe.description}</p>}
      </button>
      {open && (
        <div className="mt-2 flex flex-col gap-3 border-t border-border pt-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">ingredients</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-pretty">{recipe.ingredients}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">instructions</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-pretty">{recipe.instructions}</p>
          </div>
        </div>
      )}
      {!open && (
        <button type="button" onClick={() => setOpen(true)} className="self-start text-xs font-medium text-honey">
          view recipe
        </button>
      )}
    </div>
  )
}
