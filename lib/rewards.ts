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
export function computeStreaks(days: { day_number: number; completed_at: string }[]): {
  current: number
  longest: number
  lastDate: string | null
} {
  const dates = Array.from(new Set(days.map((d) => d.completed_at.slice(0, 10)))).sort()
  if (dates.length === 0) return { current: 0, longest: 0, lastDate: null }

  let longest = 1
  let run = 1
  for (let i = 1; i < dates.length; i++) {
    run = isNextDay(dates[i - 1], dates[i]) ? run + 1 : 1
    if (run > longest) longest = run
  }

  const last = dates[dates.length - 1]
  const today = new Date().toISOString().slice(0, 10)
  // A run counts as current if it reaches today or yesterday — she has not
  // broken anything simply by not having opened the app yet this morning.
  const current = last === today || isNextDay(last, today) ? run : 0

  return { current, longest, lastDate: last }
}

function isNextDay(a: string, b: string): boolean {
  return Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`) === 86_400_000
}

const DAY_MILESTONES: { at: number; label: string; detail: string }[] = [
  { at: 1, label: 'You started', detail: 'The hardest day is the one you begin on. That one is behind you.' },
  { at: 7, label: 'One week in', detail: 'Seven days logged. This is the point most people never reach.' },
  { at: 14, label: 'Two weeks', detail: 'Long enough that your body has noticed, not just your calendar.' },
  { at: 21, label: 'Three weeks', detail: 'The shapes are becoming yours instead of something you are copying.' },
  { at: 30, label: 'Thirty days', detail: 'A month of keeping your word to yourself.' },
  { at: 42, label: 'Six weeks', detail: 'Three quarters of the way. The end is closer than the start.' },
  { at: COURSE.length_days, label: 'Strong and Surrendered', detail: 'Fifty-six days. You finished what you started.' },
]

const WRITING_MILESTONES: { at: number; label: string; detail: string }[] = [
  { at: 1, label: 'First page', detail: 'You wrote something down instead of keeping it in your head.' },
  { at: 10, label: 'Ten pages', detail: 'A record of what you were thinking, in your own words.' },
  { at: 28, label: 'Every prompt', detail: 'You answered all twenty-eight. That is the whole workbook.' },
]

export function computeMilestones(
  progress: { day_number: number; completed_at: string }[],
  writingCount: number,
): { earned: Milestone[]; next: Milestone | null; all: Milestone[] } {
  const byDay = [...progress].sort((a, b) => a.day_number - b.day_number)
  const doneCount = byDay.length

  const all: Milestone[] = [
    ...DAY_MILESTONES.map((m) => ({
      key: `day-${m.at}`,
      at: m.at,
      label: m.label,
      detail: m.detail,
      earned: doneCount >= m.at,
      earnedOn: doneCount >= m.at ? (byDay[m.at - 1]?.completed_at ?? null) : null,
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

export interface PillarEvidence {
  pillar: 'Body' | 'Identity' | 'Mindset' | 'Faith'
  headline: string
  evidence: string
  value: number
  total: number
}

/**
 * Evidence, not a score. Every line is something she actually did, and
 * nothing here is compared to another member.
 */
export function computeBecoming(input: {
  completedDays: number[]
  writingCount: number
  ratings: { day_number: number; value: number }[]
  weeksReached: number
}): PillarEvidence[] {
  const { completedDays, writingCount, ratings, weeksReached } = input
  const sorted = [...ratings].sort((a, b) => a.day_number - b.day_number)
  const first = sorted[0]
  const last = sorted[sorted.length - 1]

  return [
    {
      pillar: 'Body',
      headline: `${completedDays.length} of ${COURSE.length_days} days`,
      evidence: completedDays.length
        ? `You have trained on ${completedDays.length} ${completedDays.length === 1 ? 'day' : 'days'}. That is time your body spent under load, not time you meant to.`
        : 'Nothing logged yet. Day one is waiting.',
      value: completedDays.length,
      total: COURSE.length_days,
    },
    {
      pillar: 'Identity',
      headline: sorted.length >= 2 ? `${first.value} → ${last.value}` : sorted.length === 1 ? `You said ${first.value}` : 'Not yet asked',
      evidence:
        sorted.length >= 2
          ? `On day ${first.day_number} you said ${first.value}. On day ${last.day_number} you said ${last.value}.`
          : sorted.length === 1
            ? `On day ${first.day_number} you said ${first.value}. The course asks again later.`
            : 'The course asks you to rate yourself as you go. Nothing to compare yet.',
      value: sorted.length,
      total: 8,
    },
    {
      pillar: 'Mindset',
      headline: `${writingCount} ${writingCount === 1 ? 'page' : 'pages'}`,
      evidence: writingCount
        ? `You have written ${writingCount} ${writingCount === 1 ? 'answer' : 'answers'} you can read back.`
        : 'Nothing written yet. Writing is offered, never required.',
      value: writingCount,
      total: 28,
    },
    {
      pillar: 'Faith',
      headline: `${weeksReached} of ${COURSE.weeks} weeks`,
      evidence: weeksReached
        ? `You have reached week ${weeksReached}, and the verse that opens it.`
        : 'Each week opens with a verse. You will meet the first one on day one.',
      value: weeksReached,
      total: COURSE.weeks,
    },
  ]
}
