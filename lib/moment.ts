/**
 * What she needs right now.
 *
 * Today was a list in the order a file happened to declare its modules. It
 * showed her tonight's retinal night at seven in the morning and her
 * check-in at eleven at night, and it did not know that Protocols or Studio
 * existed at all.
 *
 * This is the other idea. Every daily surface offers what it has, says when
 * it belongs and whether it is done, and this picks the one thing that fits
 * the hour she is actually in. Everything else falls behind it.
 *
 * The rules it keeps, which are the rules the rest of the app keeps:
 *
 * Something with a real time beats something with a rough time — a Studio
 * block at two o'clock outranks "log your food sometime this afternoon".
 *
 * Nothing from the evening appears in the morning. Being told at 7am about a
 * mask she is meant to do at 9pm is noise, and noise is what she came here
 * to escape.
 *
 * A thing already done never comes back asking again.
 */

export type Window = 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night' | 'any'

export const WINDOW_HOURS: Record<Exclude<Window, 'any'>, [number, number]> = {
  dawn: [5, 9],
  morning: [9, 12],
  afternoon: [12, 17],
  evening: [17, 21],
  night: [21, 29], // wraps past midnight
}

export function windowFor(hour: number): Exclude<Window, 'any'> {
  if (hour >= 5 && hour < 9) return 'dawn'
  if (hour >= 9 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 21) return 'evening'
  return 'night'
}

/** How the moment is greeted. Her language, not a clock's. */
export function greetingFor(hour: number, name: string | null): string {
  const w = windowFor(hour)
  const who = name ? `, ${name}` : ''
  if (w === 'dawn') return `Morning${who}`
  if (w === 'morning') return `Morning${who}`
  if (w === 'afternoon') return `Afternoon${who}`
  if (w === 'evening') return `Evening${who}`
  return `Late${who}`
}

export interface Candidate {
  key: string
  /** The thing itself, in her words. */
  label: string
  /** The engine's own reason, when it has one. */
  detail?: string
  href: string
  /** Button text when this is the headline. */
  action?: string
  /** Where in the day it belongs. */
  window: Window
  /**
   * Minutes past midnight, when this has a genuine appointment — a Studio
   * block. These outrank everything soft.
   */
  atMinute?: number
  done: boolean
  /** Which shelf colour it belongs to, so the eye sorts before the words. */
  tone: 'identity' | 'mindset' | 'body' | 'faith' | 'honey'
  /** Never hidden behind "anything else", however busy the day is. */
  pinned?: boolean
}

export interface Moment {
  greeting: string
  /** The one thing. Null when everything is genuinely done. */
  now: Candidate | null
  /** Two or three more, worth seeing without scrolling. */
  next: Candidate[]
  /** Everything else, folded away. */
  later: Candidate[]
  /** Said when there is nothing left — earned, not filler. */
  allDone: boolean
}

/** How close an appointment has to be to take over the screen. */
const APPOINTMENT_REACH_MIN = 90

function distanceToWindow(hour: number, w: Window): number {
  if (w === 'any') return 0
  const [from, to] = WINDOW_HOURS[w]
  const h = w === 'night' && hour < 5 ? hour + 24 : hour
  if (h >= from && h < to) return 0
  return h < from ? from - h : h - to + 0.5
}

/**
 * Score a candidate for this moment. Higher is more urgent.
 *
 * Deliberately readable rather than clever: an appointment that is nearly
 * here, then something that belongs to this hour, then something from
 * earlier she can still catch. Later things score below zero and wait.
 */
export function scoreFor(c: Candidate, hour: number, minute: number): number {
  if (c.done) return -1000

  const nowMin = hour * 60 + minute

  if (c.atMinute !== undefined) {
    const away = c.atMinute - nowMin
    // In it, or nearly in it.
    if (away <= 0 && away > -240) return 1000
    if (away > 0 && away <= APPOINTMENT_REACH_MIN) return 900 - away
    // Later today, but not yet.
    if (away > 0) return 50 - away / 60
    return -50
  }

  const d = distanceToWindow(hour, c.window)
  if (d === 0) return c.window === 'any' ? 300 : 500
  // Earlier in the day and still undone — catchable, quietly.
  const [from] = c.window === 'any' ? [0] : WINDOW_HOURS[c.window]
  if (hour > from) return 200 - d * 10
  // Still ahead of her. Wait.
  return -d * 10
}

/**
 * Build the moment.
 *
 * Everything comes in as candidates from the surfaces that have something to
 * offer. This only ranks — it never invents work, and it never counts what
 * she did not do.
 */
export function buildMoment(input: {
  candidates: Candidate[]
  hour: number
  minute?: number
  name?: string | null
}): Moment {
  const { candidates, hour, minute = 0, name = null } = input

  const scored = candidates
    .map((c) => ({ c, score: scoreFor(c, hour, minute) }))
    .sort((a, b) => b.score - a.score)

  const live = scored.filter((s) => s.score > -1000)
  const surfaced = live.filter((s) => s.score > 0).map((s) => s.c)
  const waiting = live.filter((s) => s.score <= 0).map((s) => s.c)

  const pinned = surfaced.filter((c) => c.pinned)
  const rest = surfaced.filter((c) => !c.pinned)

  const now = rest[0] ?? pinned[0] ?? null
  const after = [...pinned, ...rest].filter((c) => c.key !== now?.key)

  return {
    greeting: greetingFor(hour, name),
    now,
    next: after.slice(0, 3),
    later: [...after.slice(3), ...waiting],
    allDone: candidates.length > 0 && candidates.every((c) => c.done),
  }
}

/**
 * One line when the day is genuinely finished.
 *
 * Not a score and not a congratulation on a streak — just the fact, said once.
 */
export function doneLineFor(hour: number): string {
  const w = windowFor(hour)
  if (w === 'night' || w === 'evening') return 'everything you meant to do today is done.'
  return 'nothing waiting. the rest of the day is yours.'
}
