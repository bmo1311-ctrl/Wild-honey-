'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Flame, Pencil, X } from 'lucide-react'
import { removeMealLog, updateNutritionGoals } from '@/app/actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { MealLog } from '@/lib/types'
import { cn } from '@/lib/utils'

function ProgressBar({ value, goal, label, unit }: { value: number; goal: number | null; label: string; unit: string }) {
  const pct = goal ? Math.min(100, Math.round((value / goal) * 100)) : null
  const met = goal ? value >= goal : false
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span className={cn('text-muted-foreground', met && 'font-medium text-honey')}>
          {Math.round(value)}
          {unit} {goal ? `/ ${goal}${unit}` : ''}
          {met && ' ✓'}
        </span>
      </div>
      {goal && (
        <div className="h-2 overflow-hidden rounded-full bg-secondary">
          <div className={cn('h-full rounded-full transition-all', met ? 'bg-honey' : 'bg-foreground/60')} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  )
}

export function NutritionSummary({
  calories,
  protein,
  carbs,
  fat,
  calorieGoal,
  proteinGoal,
  loggedMeals,
}: {
  calories: number
  protein: number
  carbs: number
  fat: number
  calorieGoal: number | null
  proteinGoal: number | null
  loggedMeals: MealLog[]
}) {
  const [editingGoals, setEditingGoals] = useState(false)
  const [calorieInput, setCalorieInput] = useState(calorieGoal?.toString() ?? '')
  const [proteinInput, setProteinInput] = useState(proteinGoal?.toString() ?? '')
  const [pending, startTransition] = useTransition()

  function handleSaveGoals() {
    startTransition(async () => {
      const res = await updateNutritionGoals(
        calorieInput ? parseInt(calorieInput, 10) : undefined,
        proteinInput ? parseInt(proteinInput, 10) : undefined,
      )
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success('Goals saved.')
      setEditingGoals(false)
    })
  }

  function handleRemoveLog(logId: string) {
    startTransition(async () => {
      const res = await removeMealLog(logId)
      if (res?.error) toast.error(res.error)
    })
  }

  const hasGoals = calorieGoal || proteinGoal

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-card p-5 ring-1 ring-border">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 font-serif text-lg font-semibold">
          <Flame className="h-4 w-4 text-honey" />
          today's nutrition
        </p>
        <button type="button" onClick={() => setEditingGoals((e) => !e)} className="text-muted-foreground">
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>

      {editingGoals ? (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[0.65rem] text-muted-foreground">daily calorie goal</label>
              <Input type="number" value={calorieInput} onChange={(e) => setCalorieInput(e.target.value)} className="h-9" placeholder="e.g. 1800" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[0.65rem] text-muted-foreground">daily protein goal (g)</label>
              <Input type="number" value={proteinInput} onChange={(e) => setProteinInput(e.target.value)} className="h-9" placeholder="e.g. 90" />
            </div>
          </div>
          <Button onClick={handleSaveGoals} disabled={pending} className="h-9 self-start text-xs">
            save goals
          </Button>
        </div>
      ) : !hasGoals ? (
        <p className="text-xs text-muted-foreground">set your daily calorie and protein goals to start tracking progress — tap the pencil above.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          <ProgressBar value={calories} goal={calorieGoal} label="calories" unit="" />
          <ProgressBar value={protein} goal={proteinGoal} label="protein" unit="g" />
        </div>
      )}

      <div className="flex flex-wrap gap-3 border-t border-border pt-2 text-[0.7rem] text-muted-foreground">
        <span>carbs: {Math.round(carbs)}g</span>
        <span>fat: {Math.round(fat)}g</span>
      </div>

      {loggedMeals.length > 0 && (
        <div className="flex flex-col gap-1.5 border-t border-border pt-2">
          <p className="text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">logged today</p>
          {loggedMeals.map((log) => (
            <div key={log.id} className="flex items-center justify-between text-xs">
              <span className="truncate">
                {log.recipe?.title} {log.servings !== 1 ? `× ${log.servings}` : ''}
              </span>
              <button type="button" onClick={() => handleRemoveLog(log.id)} className="shrink-0 text-muted-foreground">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
