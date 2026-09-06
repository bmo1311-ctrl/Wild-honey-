import { Check } from 'lucide-react'
import type { PlannedNight } from '@/lib/tonight'
import { cn } from '@/lib/utils'

/**
 * The week, at a glance.
 *
 * Two columns of products told her what she owns but never when. This is the
 * part that answers "is tonight my acid night" without her keeping a mental
 * calendar — which was the whole thing she was trying to outsource.
 *
 * A filled dot is a treatment night, a hollow one is repair. Past days show
 * what actually happened rather than what was planned, because a plan she did
 * not follow is not history.
 */
export function WeekStrip({ nights }: { nights: PlannedNight[] }) {
  return (
    <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
      <div className="grid grid-cols-7 gap-1">
        {nights.map((night) => (
          <div
            key={night.date}
            className={cn(
              'flex flex-col items-center gap-1.5 rounded-xl px-1 py-2.5',
              night.isToday && 'bg-muted',
              night.isPast && !night.done && 'opacity-40',
            )}
          >
            <span
              className={cn(
                'text-[0.65rem] uppercase tracking-wide',
                night.isToday ? 'font-semibold text-foreground' : 'text-muted-foreground',
              )}
            >
              {night.weekday}
            </span>

            <span
              aria-hidden
              className={cn(
                'flex h-5 w-5 items-center justify-center rounded-full',
                night.kind === 'treatment'
                  ? 'bg-mindset-pillar text-white'
                  : 'border border-border bg-background',
              )}
            >
              {night.done && <Check className="h-3 w-3" />}
            </span>

            <span className="line-clamp-2 text-center text-[0.6rem] leading-tight text-muted-foreground">
              {shorten(night.label)}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-3 flex items-center justify-center gap-4 text-[0.65rem] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-mindset-pillar" />
          treatment
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full border border-border" />
          repair
        </span>
      </p>
    </div>
  )
}

/** Calendar cells are narrow. Brand names are not. */
function shorten(label: string): string {
  const words = label.split(' ')
  return words.length > 3 ? words.slice(-2).join(' ') : label
}
