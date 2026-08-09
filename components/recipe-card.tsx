'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Bookmark, Clock, Beef, Wallet, Leaf, PlayCircle, Plus, Flame } from 'lucide-react'
import { logMeal, toggleSavedRecipe } from '@/app/actions'
import type { Recipe } from '@/lib/types'
import { cn } from '@/lib/utils'

const CYCLE_LABEL: Record<string, string> = {
  menstrual: 'menstrual phase',
  follicular: 'follicular phase',
  ovulation: 'ovulation phase',
  luteal: 'luteal phase',
}

const BUDGET_LABEL: Record<string, string> = {
  budget: '$',
  moderate: '$$',
  splurge: '$$$',
}

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  const [open, setOpen] = useState(false)
  const [saved, setSaved] = useState(Boolean(recipe.saved))
  const [pending, startTransition] = useTransition()
  const [logging, setLogging] = useState(false)

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

  function handleLogMeal() {
    setLogging(true)
    startTransition(async () => {
      const res = await logMeal(recipe.id, 1)
      setLogging(false)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success(`Logged ${recipe.title}.`)
    })
  }

  return (
    <div className="flex h-full flex-col gap-2 rounded-2xl bg-card p-4 ring-1 ring-border">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {recipe.cycle_phase && recipe.cycle_phase !== 'any' && (
            <span className="rounded-full bg-honey/15 px-2 py-0.5 text-[0.65rem] font-medium text-honey">{CYCLE_LABEL[recipe.cycle_phase]}</span>
          )}
          {recipe.meal_type && recipe.meal_type !== 'any' && (
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[0.65rem] font-medium capitalize text-secondary-foreground">{recipe.meal_type}</span>
          )}
          {recipe.season && recipe.season !== 'any' && (
            <span className="flex items-center gap-0.5 rounded-full bg-secondary px-2 py-0.5 text-[0.65rem] font-medium text-secondary-foreground">
              <Leaf className="h-2.5 w-2.5" />
              {recipe.season}
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

      <div className="flex flex-wrap items-center gap-3 text-[0.7rem] text-muted-foreground">
        {recipe.prep_minutes && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {recipe.prep_minutes} min
          </span>
        )}
        {recipe.calories && (
          <span className="flex items-center gap-1">
            <Flame className="h-3 w-3" />
            {recipe.calories} cal
          </span>
        )}
        {recipe.protein_g && (
          <span className="flex items-center gap-1">
            <Beef className="h-3 w-3" />
            {recipe.protein_g}g protein
          </span>
        )}
        {recipe.budget_tier && (
          <span className="flex items-center gap-1">
            <Wallet className="h-3 w-3" />
            {BUDGET_LABEL[recipe.budget_tier]}
          </span>
        )}
      </div>

      {recipe.nutrition_highlights && !open && (
        <p className="text-[0.7rem] text-muted-foreground text-pretty">rich in {recipe.nutrition_highlights}</p>
      )}

      {open && (
        <div className="mt-1 flex flex-col gap-3 border-t border-border pt-3">
          {recipe.nutrition_highlights && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">nutrition highlights</p>
              <p className="mt-1 text-sm text-pretty">{recipe.nutrition_highlights}</p>
            </div>
          )}
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
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setOpen((o) => !o)} className="text-xs font-medium text-honey">
          {open ? 'show less' : 'view recipe'}
        </button>
        <button type="button" onClick={handleLogMeal} disabled={logging} className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
          <Plus className="h-3.5 w-3.5" />
          {logging ? 'logging…' : 'log it'}
        </button>
        {recipe.video_url && (
          <a
            href={recipe.video_url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground"
          >
            <PlayCircle className="h-3.5 w-3.5" />
            watch
          </a>
        )}
      </div>
    </div>
  )
}
