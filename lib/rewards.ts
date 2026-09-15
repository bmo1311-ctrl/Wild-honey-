import { COURSE } from '@/lib/courses'

export interface Milestone {
  key: string
  at: number
  label: string
  detail: string
  earned: boolean
  earnedOn: string | null
}

/**
 * Streaks computed from the days she actually ticked, rather than a counter
 * that resets. A gap is a gap — it ends the current run, but it never erases
 * the longest one she has already done. Nothing here is ever framed as
 * something she is about to lose.
 */
/**
 * Her run of days, counted in her own days.
 *
 * `completed_at` is a timestamp, and this sliced it to a UTC date — while
 * everything else in the app dates rows with `localToday()`. Seven hours west
 * of UTC that is wrong twice over: work done Monday evening and Tuesday
 * morning both land on the UTC Tuesday and collapse into one day, so two days
 * of work count as one; and the mirror case, Monday morning then Tuesday
 * evening, becomes UTC Monday and Wednesday, which reads as a broken run.
 *
 * Bucketing by her timezone is the only thing that makes a streak mean what
 * she thinks it means. `en-CA` because it formats as YYYY-MM-DD.
 */
export function computeStreaks(
  days: { day_number: number; completed_at: string }[],
  opts?: { today?: string; timeZone?: string },
): {
  current: number
  longest: number
  lastDate: string | null
} {
  const inHerDay = (iso: string): string => {
    if (!opts?.timeZone) return iso.slice(0, 10)
    try {
      return new Date(iso).toLocaleDateString('en-CA', { timeZone: opts.timeZone })
    } catch {
      // An unknown zone should not lose her a streak.
      return iso.slice(0, 10)
    }
  }

  const dates = Array.from(new Set(days.map((d) => inHerDay(d.completed_at)))).sort()
  if (dates.length === 0) return { current: 0, longest: 0, lastDate: null }

  let longest = 1
  let run = 1
  for (let i = 1; i < dates.length; i++) {
    run = isNextDay(dates[i - 1], dates[i]) ? run + 1 : 1
    if (run > longest) longest = run
  }

  const last = dates[dates.length - 1]
  const today = opts?.today ?? new Date().toISOString().slice(0, 10)
  // A run counts as current if it reaches today or yesterday — she has not
  // broken anything simply by not having opened the app yet this morning.
  const current = last === today || isNextDay(last, today) ? run : 0

  return { current, longest, lastDate: last }
}

function isNextDay(a: string, b: string): boolean {
  return Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`) === 86_400_000
}

/**
 * The shape of whichever course she is on.
 *
 * Everything here used to read `COURSE`, which is `COURSES[0]` — Strong and
 * Surrendered, 56 days, 8 weeks. But `/app/becoming` runs on her *active*
 * course, and the four are 56, 28, 30 and 40 days. So a woman on Daily Bread
 * finishing all 28 days saw "28 of 56 days" and "4 of 8 weeks", never earned
 * the final milestone, and was shown one titled "Strong and Surrendered —
 * Fifty-six days" for a course she was not in.
 */
export interface CourseShape {
  title: string
  lengthDays: number
  weeks: number
  /** How many prompts the course asks. Was hardcoded to 28. */
  writingPrompts?: number
  /** How many times it asks her to rate herself. Was hardcoded to 8. */
  ratings?: number
}

const FALLBACK: CourseShape = { title: COURSE.title, lengthDays: COURSE.length_days, weeks: COURSE.weeks }

function dayMilestones(course: CourseShape): { at: number; label: string; detail: string }[] {
  const spelled = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']
  const weeksWord = course.weeks <= 10 ? spelled[course.weeks] : String(course.weeks)
  return [
    // Only the marks the course is long enough to actually contain.
    ...BASE_DAY_MILESTONES.filter((m) => m.at < course.lengthDays),
    {
      at: course.lengthDays,
      label: course.title,
      detail: `${course.lengthDays} days, ${weeksWord} weeks. You finished what you started.`,
    },
  ]
}

const BASE_DAY_MILESTONES: { at: number; label: string; detail: string }[] = [
  { at: 1, label: 'You started', detail: 'The hardest day is the one you begin on. That one is behind you.' },
  { at: 7, label: 'One week in', detail: 'Seven days logged. This is the point most people never reach.' },
  { at: 14, label: 'Two weeks', detail: 'Long enough that your body has noticed, not just your calendar.' },
  { at: 21, label: 'Three weeks', detail: 'The shapes are becoming yours instead of something you are copying.' },
  { at: 30, label: 'Thirty days', detail: 'A month of keeping your word to yourself.' },
  { at: 42, label: 'Six weeks', detail: 'Three quarters of the way. The end is closer than the start.' },
]

const WRITING_MILESTONES: { at: number; label: string; detail: string }[] = [
  { at: 1, label: 'First page', detail: 'You wrote something down instead of keeping it in your head.' },
  { at: 10, label: 'Ten pages', detail: 'A record of what you were thinking, in your own words.' },
  { at: 28, label: 'Every prompt', detail: 'You answered all twenty-eight. That is the whole workbook.' },
]

export function computeMilestones(
  progress: { day_number: number; completed_at: string }[],
  writingCount: number,
  course: CourseShape = FALLBACK,
): { earned: Milestone[]; next: Milestone | null; all: Milestone[] } {
  const byDay = [...progress].sort((a, b) => a.day_number - b.day_number)
  /*
   * Which day she *actually* earned the nth milestone on.
   *
   * `byDay[m.at - 1]` assumed she completed days in order, so anyone who did
   * day 4 before day 3 got the wrong date on every milestone after it. The
   * nth milestone is earned on the nth *completion*, whichever day that was.
   */
  const byWhen = [...progress].sort((a, b) => a.completed_at.localeCompare(b.completed_at))
  const doneCount = byDay.length

  const all: Milestone[] = [
    ...dayMilestones(course).map((m) => ({
      key: `day-${m.at}`,
      at: m.at,
      label: m.label,
      detail: m.detail,
      earned: doneCount >= m.at,
      earnedOn: doneCount >= m.at ? (byWhen[m.at - 1]?.completed_at ?? null) : null,
    })),
    ...WRITING_MILESTONES.map((m) => ({
      key: `write-${m.at}`,
      at: m.at,
      label: m.label,
      detail: m.detail,
      earned: writingCount >= m.at,
      earnedOn: null,
    })),
  ]

  const earned = all.filter((m) => m.earned)
  const next = all.filter((m) => !m.earned).sort((a, b) => a.at - b.at)[0] ?? null
  return { earned, next, all }
}

/*
 * `PillarEvidence` and `computeBecoming` stood here and are deleted.
 *
 * They mapped the four pillars onto one course's completion: Body was days
 * finished out of 56, Identity was how many self-ratings she had given,
 * Mindset was pages written out of 28, and Faith was "week 3 of 12". A
 * woman's faith rendered as how far through a programme she had got, with the
 * unfilled part of the bar standing in for what she was missing.
 *
 * The pillars are Brooke's coaching plan, not a progress report. They are
 * shelves now — see lib/shelf.ts. Nothing there has a total.
 */
