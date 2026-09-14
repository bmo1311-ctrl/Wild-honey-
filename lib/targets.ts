import { applyCycle, resolvePhase, type CyclePhaseKey } from '@/lib/cycle'
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
export function ownerTargets(
  profile: Profile | null,
  loggedPhase: string | null,
  /** Already worked out by `getCyclePhase`. Pass it whenever you have it. */
  resolved?: CyclePhaseKey | null,
) {
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
   * Deciding the phase used to happen here, and the rule was "logged wins".
   * That is how the day her period started came out as luteal: she had
   * tapped luteal on a check-in that morning, then set the period start, and
   * this line preferred the earlier guess — then quietly added luteal's 7% to
   * her calories on day one of bleeding.
   *
   * The decision now belongs to `resolvePhase`, in one place, weighing both
   * things she said by how recently she said them. This function just applies
   * the adjustment to whatever it is handed.
   */
  const phase =
    resolved !== undefined
      ? resolved
      : resolvePhase({
          loggedPhase: loggedPhase ?? null,
          // No check-in date to compare against, so this is the conservative
          // reading: only callers that pass a resolved phase get the full rule.
          loggedOn: null,
          lastPeriodStart: p?.last_period_start ?? null,
          cycleLength: p?.cycle_length_days ?? null,
        }).phase
  const cycled = applyCycle(targets, phase, (p?.cycle_adjustments ?? {}) as Record<string, number>)
  return { cycled, phase, hasGoals: Boolean(p?.weight_kg), birthYear: p?.birth_year ?? null }
}
