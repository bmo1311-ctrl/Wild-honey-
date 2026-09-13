import { CommitmentsPanel } from '@/components/commitments-panel'
import { ExperimentsPanel } from '@/components/experiments-panel'
import {
  getHabits,
  getMyCommitments,
  getMyExperiments,
  getMyGoals,
  getRecentCheckins,
  getActiveCourseState,
} from '@/lib/data'
import { commitmentSuggestions, experimentSuggestions } from '@/lib/suggestions'

/**
 * The promises she made to herself, and the things she is trying out.
 *
 * Both panels used to open on an empty box — "I will…" and a blinking
 * cursor. The database showed exactly what that costs: one commitment and
 * zero experiments, ever, across the whole app. Choosing is a far easier act
 * than composing, especially at the end of a day, so both now open with a
 * handful of real options to react to.
 *
 * The suggestions are built from her own check-ins where there is enough
 * history to mean anything, and are plainly generic where there is not. See
 * lib/suggestions.ts for why that line matters.
 */
export default async function PromisesPage() {
  const [commitments, experiments, checkins, habits, goals, course] = await Promise.all([
    getMyCommitments(),
    getMyExperiments(),
    getRecentCheckins(14),
    getHabits(),
    getMyGoals(),
    getActiveCourseState(),
  ])

  const ctx = {
    goals: goals.map((g) => String(g.goal)),
    checkins: checkins.map((c) => ({
      date: c.date,
      energy: c.energy,
      sleep_quality: c.sleep_quality,
      stress: c.stress,
    })),
    habits: habits.map((h) => h.title),
    existingCommitments: commitments.map((c) => c.text),
    hasCourse: Boolean(course.enrollment && course.currentDay),
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Promises</h1>
        <p className="mt-1.5 text-[15px] leading-[1.5] text-pretty text-muted-foreground">
          what you said you&rsquo;d do, and what you&rsquo;re trying out. Reviewed on their own
          rhythm, not on a date.
        </p>
      </div>
      <CommitmentsPanel commitments={commitments} suggestions={commitmentSuggestions(ctx)} />
      <ExperimentsPanel experiments={experiments} suggestions={experimentSuggestions(ctx)} />
    </div>
  )
}
