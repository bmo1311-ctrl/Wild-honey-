import type { Pillar } from '@/lib/types'
import type { CapacityLevel } from '@/lib/personal-state'

/**
 * The four pillars as places that hold things.
 *
 * Body, Identity, Mindset and Faith are Brooke's coaching plan — what she
 * actually does with these women in person. In the app they had become four
 * coloured chips on posts, and `computeBecoming` had them as progress bars on
 * one course: Body was days completed out of 56, Faith was "week 3 of 12".
 * A woman's faith rendered as how far through a programme she got.
 *
 * This is the replacement. A pillar is not a score and has no total. It is a
 * shelf — the things worth returning to, held somewhere she can find them,
 * offered one at a time.
 *
 * Nothing here counts anything she did. There is no denominator anywhere in
 * this file, and there is not supposed to be one. See CONSCIOUSNESS.md.
 */

export type OfferingKind = 'question' | 'reading' | 'practice'

export interface Offering {
  id: string
  kind: OfferingKind
  /** The thing itself, in her words. */
  text: string
  /** Where it goes, when there is somewhere to go. */
  href?: string
  /** A reference, a source, a verse — shown small, never required. */
  note?: string
}

export interface Shelf {
  pillar: Pillar
  /** Everything held here. */
  all: Offering[]
  /** What to put in front of her today. Sized by the day she is having. */
  offered: Offering[]
}

/**
 * How much to offer.
 *
 * The same shelf, three sizes. On a stretched day one thing, because the
 * honest response to a woman with no room is subtraction — and a wall of
 * options is another thing to get through. On an abundant day, more, because
 * she has somewhere to put it.
 *
 * Not a reduced goal and not a lite mode. The same shelf, sized to the woman
 * who actually showed up.
 */
export const OFFER_SIZE: Record<CapacityLevel, number> = {
  stretched: 1,
  available: 2,
  abundant: 3,
}

/**
 * Pick without shuffling on every render.
 *
 * She opens Today four times before lunch. If this used `Math.random()` the
 * offering would be a different verse each time, which teaches her that none
 * of it was chosen for her. Seeded on the date and the pillar, so it is
 * steady all day and different tomorrow.
 *
 * Deliberately not seeded on her id: two women in the same circle seeing the
 * same verse on the same morning is a feature of a circle, not a collision.
 */
export function seedFrom(date: string, pillar: string): number {
  let h = 2166136261
  for (const ch of `${date}:${pillar}`) {
    h ^= ch.charCodeAt(0)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

/** Deterministic rotation through the shelf, starting at the seed. */
export function offerFrom(all: Offering[], seed: number, count: number): Offering[] {
  if (all.length === 0) return []
  const take = Math.min(count, all.length)
  const start = seed % all.length
  return Array.from({ length: take }, (_, i) => all[(start + i) % all.length])
}

export function buildShelf(pillar: Pillar, all: Offering[], capacity: CapacityLevel, today: string): Shelf {
  return {
    pillar,
    all,
    offered: offerFrom(all, seedFrom(today, pillar), OFFER_SIZE[capacity]),
  }
}

/**
 * What the app says above the four shelves.
 *
 * Describes the day, never her. "You have room" is about this week; "there is
 * a lot on you" is about what she has named. Neither is a grade, and none of
 * the three implies she should be in a different one.
 */
export const DAY_NOTE: Record<CapacityLevel, string> = {
  stretched: 'One thing from each, and only if you want it. There is a lot on you right now.',
  available: 'A couple from each. Take what you need and leave the rest.',
  abundant: 'You have room this week. Here is more of it.',
}
