'use client'

import { useMemo, useState } from 'react'
import { PillarRows } from '@/components/pillar-rows'
import { RecipeCard } from '@/components/recipe-card'
import { Bookmark } from 'lucide-react'
import type { Recipe } from '@/lib/types'

const MEAL_TYPES = [
  { value: '', label: 'any meal' },
  { value: 'breakfast', label: 'breakfast' },
  { value: 'lunch', label: 'lunch' },
  { value: 'dinner', label: 'dinner' },
  { value: 'snack', label: 'snack' },
  { value: 'juice', label: 'juice' },
  { value: 'mocktail', label: 'mocktail' },
]

const CYCLE_PHASES = [
  { value: '', label: 'any cycle phase' },
  { value: 'menstrual', label: 'menstrual' },
  { value: 'follicular', label: 'follicular' },
  { value: 'ovulation', label: 'ovulation' },
  { value: 'luteal', label: 'luteal' },
]

const SEASONS = [
  { value: '', label: 'any season' },
  { value: 'spring', label: 'spring' },
  { value: 'summer', label: 'summer' },
  { value: 'fall', label: 'fall' },
  { value: 'winter', label: 'winter' },
]

const BUDGETS = [
  { value: '', label: 'any budget' },
  { value: 'budget', label: '$ budget' },
  { value: 'moderate', label: '$$ moderate' },
  { value: 'splurge', label: '$$$ splurge' },
]

const TIMES = [
  { value: '', label: 'any time' },
  { value: '15', label: 'under 15 min' },
  { value: '30', label: 'under 30 min' },
  { value: '45', label: 'under 45 min' },
]

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-full border border-input bg-card px-3 text-xs font-medium text-foreground"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

export function RecipeFilterBar({ recipes }: { recipes: Recipe[] }) {
  const [mealType, setMealType] = useState('')
  const [cyclePhase, setCyclePhase] = useState('')
  const [season, setSeason] = useState('')
  const [budget, setBudget] = useState('')
  const [maxTime, setMaxTime] = useState('')

  const filtered = useMemo(() => {
    return recipes.filter((r) => {
      if (mealType && r.meal_type !== mealType && r.meal_type !== 'any') return false
      if (cyclePhase && r.cycle_phase !== cyclePhase && r.cycle_phase !== 'any') return false
      if (season && r.season !== season && r.season !== 'any') return false
      if (budget && r.budget_tier !== budget) return false
      if (maxTime && r.prep_minutes && r.prep_minutes > parseInt(maxTime, 10)) return false
      return true
    })
  }, [recipes, mealType, cyclePhase, season, budget, maxTime])

  const anyActive = mealType || cyclePhase || season || budget || maxTime

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Select value={mealType} onChange={setMealType} options={MEAL_TYPES} />
        <Select value={cyclePhase} onChange={setCyclePhase} options={CYCLE_PHASES} />
        <Select value={season} onChange={setSeason} options={SEASONS} />
        <Select value={budget} onChange={setBudget} options={BUDGETS} />
        <Select value={maxTime} onChange={setMaxTime} options={TIMES} />
        {anyActive && (
          <button
            type="button"
            onClick={() => {
              setMealType('')
              setCyclePhase('')
              setSeason('')
              setBudget('')
              setMaxTime('')
            }}
            className="h-9 rounded-full px-3 text-xs font-medium text-honey"
          >
            clear filters
          </button>
        )}
      </div>

      {anyActive && (
        <p className="text-xs text-muted-foreground">
          {filtered.length} recipe{filtered.length === 1 ? '' : 's'} match
        </p>
      )}

      <PillarRows
        items={filtered}
        cardWidthClass="w-[260px]"
        renderItem={(r) => <RecipeCard recipe={r} />}
        extraFilter={{
          label: 'saved',
          icon: <Bookmark className="h-3 w-3" />,
          predicate: (r) => Boolean(r.saved),
        }}
        emptyMessage={anyActive ? 'nothing matches those filters yet — try loosening one.' : 'nothing here yet — check back soon.'}
      />
    </div>
  )
}
