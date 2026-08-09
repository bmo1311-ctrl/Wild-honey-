import { CalendarView } from '@/components/calendar-view'
import { CommitmentsPanel } from '@/components/commitments-panel'
import { ExperimentsPanel } from '@/components/experiments-panel'
import { getMyCommitments, getMyExperiments } from '@/lib/data'

export default async function CalendarPage() {
  const [commitments, experiments] = await Promise.all([getMyCommitments(), getMyExperiments()])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Calendar</h1>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">
          switch between the standard calendar and Wild Honey's 13-month rhythm — every month exactly 28 days, with Sol as a threshold between June and July.
        </p>
      </div>
      <CommitmentsPanel commitments={commitments} />
      <ExperimentsPanel experiments={experiments} />
      <CalendarView />
    </div>
  )
}
