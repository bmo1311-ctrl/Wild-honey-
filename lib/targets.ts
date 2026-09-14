import { applyCycle, type CyclePhaseKey } from '@/lib/cycle'
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
export function ownerTargets(profile: Profile | null, phase: CyclePhaseKey | null) {
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
  /*
   * The phase arrives already decided. It is not worked out here.
   *
   * Deciding it here was the bug: the rule was "a logged phase wins", so the
   * day her period started, a luteal chip tapped that morning outranked her
   * setting the period start, and this quietly added luteal's 7% to her
   * calories on day one of bleeding.
   *
   * The first repair left a fallback for callers that passed no phase, and
   * that fallback was quietly wrong in two ways of its own — it could not see
   * her period or luteal lengths, so it fell back to the 5-and-14 averages
   * `cycleShape` exists to replace, and it passed no check-in date, which made
   * the dates beat the logged phase unconditionally. It was dead code that
   * would have bitten the first caller to lean on it.
   *
   * So there is no fallback now. `getCyclePhase` is the one place that
   * decides; this function only applies the adjustment.
   */
  const cycled = applyCycle(targets, phase, (p?.cycle_adjustments ?? {}) as Record<string, number>)
  return { cycled, phase, hasGoals: Boolean(p?.weight_kg), birthYear: p?.birth_year ?? null }
}
