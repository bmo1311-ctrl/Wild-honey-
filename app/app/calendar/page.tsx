import { CalendarView } from '@/components/calendar-view'

export default function CalendarPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Calendar</h1>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">
          switch between the standard calendar and Wild Honey's 13-month rhythm — every month exactly 28 days, with Sol as a threshold between June and July.
        </p>
      </div>
      <CalendarView />
    </div>
  )
}
