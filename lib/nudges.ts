/**
 * What an accountability partner would actually say: one or two specific,
 * true things about today, computed from what she has and hasn't done. No
 * streak threats, no guilt — a gap is named once, plainly, with the next step.
 */
export interface Nudge {
  text: string
  href: string
}

export function nudgesFor(input: {
  hour: number
  courseDay: { number: number; slug: string } | null
  courseDayDone: boolean
  mealsLogged: number
  checkedIn: boolean
  daysSinceCheckin: number | null
  weekHit: number
  writingsCount: number
}): Nudge[] {
  const out: Nudge[] = []
  const { hour } = input

  if (input.courseDay && !input.courseDayDone && hour >= 17) {
    out.push({ text: `Day ${input.courseDay.number} is still open — it takes one tap to close it.`, href: `/app/program/${input.courseDay.slug}/day/${input.courseDay.number}` })
  } else if (input.courseDay && !input.courseDayDone && hour >= 12) {
    out.push({ text: `Day ${input.courseDay.number} is waiting. Afternoon is a fine time.`, href: `/app/program/${input.courseDay.slug}/day/${input.courseDay.number}` })
  }

  if (input.mealsLogged === 0 && hour >= 11) {
    out.push({ text: "Nothing logged yet today. Even one meal keeps the day's picture honest.", href: '/app/nutrition/log' })
  }

  if (!input.checkedIn && input.daysSinceCheckin !== null && input.daysSinceCheckin >= 3) {
    out.push({ text: `${input.daysSinceCheckin} days since you said how you feel. Thirty seconds.`, href: '/app/checkin' })
  }

  if (out.length === 0 && input.weekHit >= 5) {
    out.push({ text: `${input.weekHit} of the last 7 days had something in them. That is the habit forming.`, href: '/app/becoming' })
  }

  return out.slice(0, 2)
}
