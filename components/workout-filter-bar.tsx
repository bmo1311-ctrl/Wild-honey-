'use client'

import { useMemo, useState } from 'react'
import { WorkoutCard } from '@/components/workout-card'
import { shuffle } from '@/components/pillar-rows'
import type { Workout } from '@/lib/types'

const BODY_GROUPS = [
  { value: '', label: 'all body groups' },
  { value: 'full_body', label: 'full body' },
  { value: 'upper_body', label: 'upper body' },
  { value: 'lower_body', label: 'lower body' },
  { value: 'core', label: 'core' },
  { value: 'glutes', label: 'glutes' },
  { value: 'arms', label: 'arms' },
  { value: 'back', label: 'back' },
]

const WORKOUT_TYPES = [
  { value: '', label: 'all types' },
  { value: 'strength', label: 'strength' },
  { value: 'cardio', label: 'cardio' },
  { value: 'stretch', label: 'stretch' },
  { value: 'mobility', label: 'mobility' },
  { value: 'hiit', label: 'HIIT' },
  { value: 'yoga', label: 'yoga' },
  { value: 'recovery', label: 'recovery' },
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

export function WorkoutFilterBar({ workouts }: { workouts: Workout[] }) {
  const [bodyGroup, setBodyGroup] = useState('')
  const [workoutType, setWorkoutType] = useState('')

  const shuffled = useMemo(() => shuffle(workouts), [workouts])

  const filtered = useMemo(() => {
    return shuffled.filter((w) => {
      if (bodyGroup && w.body_group !== bodyGroup && w.body_group !== 'any') return false
      if (workoutType && w.workout_type !== workoutType && w.workout_type !== 'any') return false
      return true
    })
  }, [shuffled, bodyGroup, workoutType])

  const anyActive = bodyGroup || workoutType

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Select value={bodyGroup} onChange={setBodyGroup} options={BODY_GROUPS} />
        <Select value={workoutType} onChange={setWorkoutType} options={WORKOUT_TYPES} />
        {anyActive && (
          <button
            type="button"
            onClick={() => {
              setBodyGroup('')
              setWorkoutType('')
            }}
            className="h-9 rounded-full px-3 text-xs font-medium text-honey"
          >
            clear filters
          </button>
        )}
      </div>

      {anyActive && (
        <p className="text-xs text-muted-foreground">
          {filtered.length} workout{filtered.length === 1 ? '' : 's'} match
        </p>
      )}

      {filtered.length === 0 ? (
        <p className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground ring-1 ring-border">
          {anyActive ? 'nothing matches those filters yet — try loosening one.' : 'no workouts posted yet.'}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((w) => (
            <WorkoutCard key={w.id} workout={w} />
          ))}
        </div>
      )}
    </div>
  )
}
