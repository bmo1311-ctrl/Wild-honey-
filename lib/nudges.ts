export interface Nudge {
  text: string
  href: string
}

/**
 * At most one line, and only when it has something worth saying.
 *
 * This used to carry four rules, three of which counted what she had not
 * done — nothing logged yet, three days since you said how you feel — and
 * all three repeated a row the checklist was already showing. Saying it
 * twice does not make it kinder, and counting her absence back at her is the
 * exact thing the noticing engine refuses to do.
 *
 * What is left is an evening reminder that the day is still there for her,
 * and an observation when a week has gone well. Both are things she did or
 * can still do. Neither is a deficit.
 */
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

  // Evening, and the day is still open. An offer, not a scolding.
  if (input.courseDay && !input.courseDayDone && hour >= 17) {
    out.push({
      text: `Day ${input.courseDay.number} is there whenever you want it. One tap closes it.`,
      href: `/app/program/${input.courseDay.slug}/day/${input.courseDay.number}`,
    })
  }

  // A good week, named. This is the only one that fires when nothing is owed.
  if (out.length === 0 && input.weekHit >= 5) {
    out.push({
      text: `${input.weekHit} of the last 7 days had something in them. That is the habit forming.`,
      href: '/app/becoming',
    })
  }

  return out.slice(0, 1)
}
