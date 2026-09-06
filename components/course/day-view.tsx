import type { TrackedToday } from '@/components/course/log-block'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Blocks } from '@/components/course/blocks'
import { DoneButton } from '@/components/course/done-button'
import { pillarsOf, splitMilestone, type Pillar4 } from '@/lib/courses'
import { PillarDots } from '@/components/course/pillar-dots'
import type { Course, CourseDay, CourseWriting } from '@/lib/courses'
import type { Checkin } from '@/lib/types'
import { cn } from '@/lib/utils'

/**
 * One day, rendered the same whether she reached it from Today or from
 * Program. Nothing here competes with the primary action.
 */
export function DayView({
  course,
  day,
  saved,
  checkin,
  tracked = null,
  done,
  doneAt,
  part,
  showNav = true,
  pillars: pillarsProp,
}: {
  course: Course
  day: CourseDay
  saved: Map<number, CourseWriting>
  checkin: Checkin | null
  tracked?: TrackedToday | null
  done: boolean
  doneAt: string | null
  part?: 1 | 2
  showNav?: boolean
  pillars?: Pillar4[]
}) {
  const split = day.kind === 'milestone' ? splitMilestone(day.blocks) : null
  const twoPart = split !== null
  const activePart: 1 | 2 = twoPart ? (part ?? 1) : 1
  const blocks = twoPart ? (activePart === 1 ? split.part1 : split.part2) : day.blocks

  // Part 2 renders the tail, so its blocks keep their original indices —
  // prompt_index must stay stable across the split.
  const offset = twoPart && activePart === 2 ? split.part1.length : 0

  const prev = day.day_number > 1 ? day.day_number - 1 : null
  const next = day.day_number < course.length_days ? day.day_number + 1 : null

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="text-[11px] uppercase tracking-[0.14em] text-mindset-pillar">
          Week {day.week_number} · Day {day.day_number}
        </p>
        <h1 className={cn('mt-1.5 font-serif font-semibold leading-[1.1] text-balance', twoPart ? 'text-[31px]' : 'text-[29px]')}>{day.title}</h1>
        <p className="mt-1.5 flex items-center gap-2 text-sm text-muted-foreground">
          {day.kind} · {day.minutes} min
          <PillarDots pillars={pillarsProp ?? pillarsOf(day.blocks)} size="md" />
          <span className="text-xs">{(pillarsProp ?? pillarsOf(day.blocks)).join(' · ').toLowerCase()}</span>
        </p>

        {twoPart && (
          <div className="mt-4">
            <div className="flex gap-1.5">
              <span className={cn('h-1.5 flex-1 rounded-full', 'bg-primary')} />
              <span className={cn('h-1.5 flex-1 rounded-full', activePart === 2 ? 'bg-primary' : 'bg-muted')} />
            </div>
            <p className="mt-2 text-xs font-medium text-muted-foreground">
              {activePart === 1 ? `Part 1 of 2 · sitting down · ${day.minutes} min` : 'Part 2 of 2 · on your feet'}
              {activePart === 2 && <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[11px]">Part 1 ✓</span>}
            </p>
          </div>
        )}
      </header>

      <Blocks blocks={blocks} ctx={{ dayNumber: day.day_number, slug: course.slug, saved, checkin, tracked, offset }} />

      <div className="flex flex-col gap-3 pt-2">
        {twoPart && activePart === 1 ? (
          <Link
            href={`/app/program/${course.slug}/day/${day.day_number}?part=2`}
            className="flex h-[58px] w-full items-center justify-center rounded-2xl bg-primary text-[18px] font-bold text-primary-foreground"
          >
            The writing is done
          </Link>
        ) : (
          <DoneButton dayNumber={day.day_number} slug={course.slug} initialDone={done} doneAt={doneAt} />
        )}

        {showNav && (
          <div className="flex items-center justify-between">
            {prev ? (
              <Link href={`/app/program/${course.slug}/day/${prev}`} className="flex h-11 items-center gap-1 pr-3 text-sm text-muted-foreground">
                <ChevronLeft className="h-4 w-4" />
                Day {prev}
              </Link>
            ) : (
              <span />
            )}
            {next && (
              <Link href={`/app/program/${course.slug}/day/${next}`} className="flex h-11 items-center gap-1 pl-3 text-sm text-muted-foreground">
                Day {next}
                <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
