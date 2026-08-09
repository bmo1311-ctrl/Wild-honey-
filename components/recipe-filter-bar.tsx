'use client'

import { useMemo, useState } from 'react'
import { Bookmark, Baby } from 'lucide-react'
import { RecipeCard } from '@/components/recipe-card'
import { shuffle } from '@/components/pillar-rows'
import { cn } from '@/lib/utils'
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
  const [savedOnly, setSavedOnly] = useState(false)
  const [kidFriendlyOnly, setKidFriendlyOnly] = useState(false)

  // Shuffle once per mount so the order isn't just newest-first.
  const shuffled = useMemo(() => shuffle(recipes), [recipes])

  const filtered = useMemo(() => {
    return shuffled.filter((r) => {
      if (savedOnly && !r.saved) return false
      if (kidFriendlyOnly && !r.kid_friendly) return false
      if (mealType && r.meal_type !== mealType && r.meal_type !== 'any') return false
      if (cyclePhase && r.cycle_phase !== cyclePhase && r.cycle_phase !== 'any') return false
      if (season && r.season !== season && r.season !== 'any') return false
      if (budget && r.budget_tier !== budget) return false
      if (maxTime && r.prep_minutes && r.prep_minutes > parseInt(maxTime, 10)) return false
      return true
    })
  }, [shuffled, mealType, cyclePhase, season, budget, maxTime, savedOnly, kidFriendlyOnly])

  const anyActive = mealType || cyclePhase || season || budget || maxTime || savedOnly || kidFriendlyOnly

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Select value={mealType} onChange={setMealType} options={MEAL_TYPES} />
        <Select value={cyclePhase} onChange={setCyclePhase} options={CYCLE_PHASES} />
        <Select value={season} onChange={setSeason} options={SEASONS} />
        <Select value={budget} onChange={setBudget} options={BUDGETS} />
        <Select value={maxTime} onChange={setMaxTime} options={TIMES} />
        <button
          type="button"
          onClick={() => setSavedOnly((s) => !s)}
          className={cn(
            'flex h-9 items-center gap-1 rounded-full border border-input px-3 text-xs font-medium',
            savedOnly ? 'bg-honey text-honey-foreground border-honey' : 'bg-card text-foreground',
          )}
        >
          <Bookmark className="h-3 w-3" />
          saved
        </button>
        <button
          type="button"
          onClick={() => setKidFriendlyOnly((s) => !s)}
          className={cn(
            'flex h-9 items-center gap-1 rounded-full border border-input px-3 text-xs font-medium',
            kidFriendlyOnly ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-card text-foreground',
          )}
        >
          <Baby className="h-3 w-3" />
          kid-friendly
        </button>
        {anyActive && (
          <button
            type="button"
            onClick={() => {
              setMealType('')
              setCyclePhase('')
              setSeason('')
              setBudget('')
              setMaxTime('')
              setSavedOnly(false)
              setKidFriendlyOnly(false)
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

      {filtered.length === 0 ? (
        <p className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground ring-1 ring-border">
          {anyActive ? 'nothing matches those filters yet — try loosening one.' : 'nothing here yet — check back soon.'}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <RecipeCard key={r.id} recipe={r} />
          ))}
        </div>
      )}
    </div>
  )
}
