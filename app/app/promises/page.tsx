import { CommitmentsPanel } from '@/components/commitments-panel'
import { ExperimentsPanel } from '@/components/experiments-panel'
import { getMyCommitments, getMyExperiments } from '@/lib/data'

/**
 * The promises she made to herself, and the things she is trying out.
 *
 * These used to live on a page called Calendar, underneath a thirteen-month
 * calendar — which meant the app had two calendars and neither of them was
 * the one she actually plans her work in. The thirteen-month view is gone;
 * Studio is the calendar now.
 *
 * Commitments and experiments were never calendar features. A commitment is
 * a sentence she wrote and agreed to look at again in a fortnight; an
 * experiment is a short trial with a reflection at the end. Both are about
 * keeping her word to herself, which is why they get their own page and a
 * name that says so.
 */
export default async function PromisesPage() {
  const [commitments, experiments] = await Promise.all([getMyCommitments(), getMyExperiments()])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Promises</h1>
        <p className="mt-1.5 text-[15px] leading-[1.5] text-pretty text-muted-foreground">
          what you said you&rsquo;d do, and what you&rsquo;re trying out. Reviewed on their own
          rhythm, not on a date.
        </p>
      </div>
      <CommitmentsPanel commitments={commitments} />
      <ExperimentsPanel experiments={experiments} />
    </div>
  )
}
