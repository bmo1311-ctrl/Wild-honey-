import { Check } from 'lucide-react'
import type { PlannedWashDay } from '@/lib/wash-day'
import { cn } from '@/lib/utils'

/**
 * The fortnight, at a glance.
 *
 * Two weeks rather than one: on a three-day rhythm a single week holds two
 * washes, which is not enough to see protein and moisture take turns — and
 * that alternation is the whole thing worth looking at.
 */
export function WashStrip({ days }: { days: PlannedWashDay[] }) {
  return (
    <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => (
          <div
            key={d.date}
            className={cn(
              'flex flex-col items-center gap-1.5 rounded-xl px-1 py-2.5',
              d.isToday && 'bg-muted',
              d.isPast && !d.done && 'opacity-40',
            )}
          >
            <span
              className={cn(
                'text-[0.65rem] uppercase tracking-wide',
                d.isToday ? 'font-semibold text-foreground' : 'text-muted-foreground',
              )}
            >
              {d.weekday}
            </span>

            <span
              aria-hidden
              className={cn(
                'flex h-5 w-5 items-center justify-center rounded-full',
                d.isWash ? 'bg-mindset-pillar text-white' : 'border border-border bg-background',
              )}
            >
              {d.done && <Check className="h-3 w-3" />}
            </span>

            <span className="line-clamp-2 text-center text-[0.6rem] leading-tight text-muted-foreground">
              {d.isWash ? shorten(d.label) : ''}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-3 flex items-center justify-center gap-4 text-[0.65rem] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-mindset-pillar" />
          wash
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full border border-border" />
          between
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
