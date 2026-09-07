import type { Candidate } from './moment'
import type { Tonight } from './tonight'
import type { WashPlan } from './wash-day'
import type { BlockPlan, StudioBlock } from './studio'
import { timeLabel } from './studio'

/**
 * What every surface in the app is offering right now.
 *
 * Deliberately pure: it takes what the page has already fetched and returns
 * candidates. No decisions about order live here — that is `buildMoment`'s
 * job — so this file can be read as a plain inventory of what the app can
 * ask of her on any given day.
 *
 * The three at the bottom are the ones Today has never known about.
 * Protocols has been working out which serum belongs to tonight since the
 * day it was built, and Studio has been naming the exact piece that goes in
 * the two o'clock block, and neither of them has ever been able to say so on
 * the page called Today. That was the actual bug.
 */
export function candidatesFor(input: {
  today: string
  /** The course day, when she is carrying one. */
  courseDay: { number: number; title: string; minutes: number; slug: string } | null
  courseDayDone: boolean
  checkedIn: boolean
  mealsLogged: number
  /** Her habits with their anchor — anchors decide the hour. */
  habits: { id: string; title: string; anchor: string | null; doneToday: boolean }[]
  daysSinceWeighIn: number | null
  /** Today's writing prompt, when she has not answered it. */
  promptAnswered: boolean
  hasPrompt: boolean
  /** Tonight's skincare, from the Protocols engine. */
  tonight: Tonight | null
  tonightDone: boolean
  /** Hair, which runs on washes rather than nights. */
  wash: WashPlan | null
  washedToday: boolean
  /** Studio blocks that fall on today, already planned. */
  studioToday: { block: StudioBlock; plan: BlockPlan; kept: boolean }[]
}): Candidate[] {
  const out: Candidate[] = []

  if (input.courseDay) {
    const d = input.courseDay
    out.push({
      key: 'course',
      label: `Day ${d.number} — ${d.title}`,
      detail: `${d.minutes} min`,
      href: `/app/program/${d.slug}/day/${d.number}`,
      action: `Open day ${d.number}`,
      // The course is the reason most of them are here, so it gets the
      // morning, but it never disappears later in the day.
      window: 'any',
      done: input.courseDayDone,
      tone: 'identity',
      pinned: true,
    })
  }

  if (input.hasPrompt) {
    out.push({
      key: 'prompt',
      label: "Today's prompt",
      detail: 'a few lines, whenever it lands',
      href: '/app/write',
      action: 'Write',
      window: 'any',
      done: input.promptAnswered,
      tone: 'mindset',
    })
  }

  out.push({
    key: 'checkin',
    label: 'How you are today',
    detail: 'three scales',
    href: '/app/checkin',
    action: 'Check in',
    window: 'dawn',
    done: input.checkedIn,
    tone: 'mindset',
  })

  /*
   * Food is three separate moments, not one task.
   *
   * A single "log your food" row is a to-do at bedtime and useless at
   * breakfast. Three rows means the app asks at the hour she is actually
   * holding the plate — and each one closes as soon as she logs.
   */
  const meals = input.mealsLogged
  out.push({
    key: 'breakfast',
    label: 'Breakfast',
    href: '/app/nutrition',
    action: 'Log it',
    window: 'dawn',
    done: meals >= 1,
    tone: 'body',
  })
  out.push({
    key: 'lunch',
    label: 'Lunch',
    href: '/app/nutrition',
    action: 'Log it',
    window: 'afternoon',
    done: meals >= 2,
    tone: 'body',
  })
  out.push({
    key: 'dinner',
    label: 'Dinner',
    href: '/app/nutrition',
    action: 'Log it',
    window: 'evening',
    done: meals >= 3,
    tone: 'body',
  })

  /*
   * Habits go where she said they go.
   *
   * An anchor is not decoration — "after coffee" means the morning and
   * "before bed" means the night, and a habit that shows up at the wrong
   * hour is the reason habit lists get ignored.
   */
  for (const h of input.habits) {
    out.push({
      key: `habit:${h.id}`,
      label: h.title,
      detail: h.anchor ?? undefined,
      href: '/app/energy',
      action: 'Mark it done',
      window: windowFromAnchor(h.anchor),
      done: h.doneToday,
      tone: 'faith',
    })
  }

  if (input.daysSinceWeighIn === null || input.daysSinceWeighIn >= 7) {
    out.push({
      key: 'measure',
      label: 'Measurements',
      detail: input.daysSinceWeighIn === null ? 'first time' : `${input.daysSinceWeighIn} days since the last`,
      href: '/app/body',
      action: 'Add today',
      window: 'dawn',
      done: false,
      tone: 'body',
    })
  }

  // ── The three Today has never seen ──────────────────────────────────────

  if (input.tonight) {
    const t = input.tonight
    out.push({
      key: 'tonight',
      label:
        t.kind === 'treatment' && t.treatment
          ? `Tonight is ${t.treatment.name}`
          : 'A nourish night',
      detail: t.reason,
      href: '/app/protocols?area=skin',
      action: 'Open tonight',
      // Never before five. Being told at breakfast about a retinal she uses
      // at nine at night is exactly the noise she asked me to remove.
      window: 'evening',
      done: input.tonightDone,
      tone: 'honey',
    })
  }

  if (input.wash?.isWashDay) {
    out.push({
      key: 'wash',
      label: 'Wash day',
      detail: input.wash.reason,
      href: '/app/protocols?area=hair',
      action: 'Open your wash',
      window: 'evening',
      done: input.washedToday,
      tone: 'honey',
    })
  }

  for (const { block, plan, kept } of input.studioToday) {
    out.push({
      key: `studio:${block.id}`,
      label: plan.item ? `${plan.action}: ${plan.item.title}` : `${block.label} — ${plan.action}`,
      detail: `${timeLabel(block.startMinute)} · ${plan.why}`,
      href: '/app/studio',
      action: plan.item ? plan.action : 'Catch an idea',
      window: 'any',
      // The only thing in the app with a real appointment. It outranks
      // everything soft while it is happening.
      atMinute: block.startMinute,
      done: kept,
      tone: 'identity',
    })
  }

  return out
}

/**
 * Turn an anchor she wrote herself into an hour of the day.
 *
 * Free text, so this only recognises what people actually type. Anything it
 * does not recognise stays 'any' rather than being guessed at — a habit
 * pushed to the wrong end of the day is worse than one with no opinion.
 */
export function windowFromAnchor(anchor: string | null): Candidate['window'] {
  if (!anchor) return 'any'
  const a = anchor.toLowerCase()
  if (/\b(bed|night|sleep|evening|dinner|wind ?down|shower)\b/.test(a)) return 'night'
  if (/\b(wake|waking|morning|coffee|breakfast|first thing|sunrise)\b/.test(a)) return 'dawn'
  if (/\b(lunch|midday|noon|afternoon)\b/.test(a)) return 'afternoon'
  if (/\b(work|school run|commute)\b/.test(a)) return 'morning'
  return 'any'
}
