import { applyCycle, phaseFromDates, type CyclePhaseKey } from '@/lib/cycle'
import { calculateTargets, effectiveTargets, type ActivityLevel, type BodyGoal } from '@/lib/goals'
import type { Profile } from '@/lib/types'

type BodyProfile = Profile & {
  weight_kg?: number | null
  height_cm?: number | null
  birth_year?: number | null
  activity_level?: string | null
  body_goal?: string | null
  last_period_start?: string | null
  cycle_length_days?: number | null
  cycle_adjustments?: Record<string, number> | null
}

/**
 * Her daily targets, worked out from her own body and goal and shifted for
 * where she is in her cycle. One place, so the Nutrition hub, the log screen
 * and Today all show the same numbers.
 */
export function ownerTargets(profile: Profile | null, loggedPhase: string | null) {
  const p = profile as BodyProfile | null
  const calculated = calculateTargets({
    weightKg: p?.weight_kg ?? null,
    heightCm: p?.height_cm ?? null,
    birthYear: p?.birth_year ?? null,
    activity: (p?.activity_level as ActivityLevel) ?? null,
    goal: (p?.body_goal as BodyGoal) ?? null,
  })
  const targets = effectiveTargets(calculated, {
    ...(p?.daily_calorie_goal ? { calories: p.daily_calorie_goal } : {}),
    ...(p?.daily_protein_goal_g ? { protein_g: p.daily_protein_goal_g } : {}),
  })
  // A phase she logged on a check-in wins; otherwise work it out from her dates.
  const phase =
    loggedPhase && loggedPhase !== 'not_tracked'
      ? (loggedPhase as CyclePhaseKey)
      : phaseFromDates(p?.last_period_start ?? null, p?.cycle_length_days ?? 28)
  const cycled = applyCycle(targets, phase, (p?.cycle_adjustments ?? {}) as Record<string, number>)
  return { cycled, phase, hasGoals: Boolean(p?.weight_kg), birthYear: p?.birth_year ?? null }
}
