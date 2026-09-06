/**
 * Nourishing rituals — the nights between the strong nights.
 *
 * Actives do the work, but they cost the barrier something. The nights in
 * between are not empty nights to be filled with more actives; they are how
 * the skin catches up. These are what goes there.
 *
 * Kitchen ingredients on purpose. Nothing here needs buying, which means a
 * rest night never feels like a lesser night.
 */

export interface Ritual {
  slug: string
  title: string
  /** Two or three lines, her voice, no fuss. */
  how: string
  minutes: number
  /** Skip when she has said she avoids one of these. Matched against profile allergies. */
  contains: string[]
}

export const RITUALS: Ritual[] = [
  {
    slug: 'honey-mask',
    title: 'raw honey mask',
    how: 'a spoonful of raw honey onto dry skin. leave it fifteen minutes, rinse warm. it holds water in and calms things down — and it is the one your brand is named for.',
    minutes: 15,
    contains: ['honey'],
  },
  {
    slug: 'oat-soak',
    title: 'oat and yoghurt soak',
    how: 'blend a spoon of oats into plain yoghurt until it is a paste. ten minutes on, rinse. for the nights after an acid, when everything feels a little thin.',
    minutes: 10,
    contains: ['oats', 'dairy'],
  },
  {
    slug: 'oil-slug',
    title: 'seal it in',
    how: 'damp skin, a few drops of squalane or jojoba, then your moisturiser over the top. nothing clever — it just stops the water leaving overnight.',
    minutes: 3,
    contains: [],
  },
  {
    slug: 'green-tea-compress',
    title: 'green tea compress',
    how: 'brew a bag, let it go properly cold, soak a cloth and lay it over your face for ten minutes. good for heat, redness, and the day being too much.',
    minutes: 10,
    contains: [],
  },
  {
    slug: 'aloe-night',
    title: 'aloe, and nothing else',
    how: 'pure aloe gel on clean skin, moisturiser on top, and that is the whole routine tonight. a real night off.',
    minutes: 3,
    contains: ['aloe'],
  },
  {
    slug: 'rice-water-rinse',
    title: 'rice water rinse',
    how: 'the cloudy water from rinsing rice, kept in the fridge. splash it on after cleansing and let it dry. quiet, brightening, free.',
    minutes: 5,
    contains: [],
  },
]

export function getRitual(slug: string): Ritual | undefined {
  return RITUALS.find((r) => r.slug === slug)
}

/**
 * A ritual she can actually use tonight.
 *
 * Rotates by date so it is not the same one every rest night, and skips
 * anything she has told us she avoids.
 */
export function ritualFor(date: string, allergies?: string | null, exclude: string[] = []): Ritual | null {
  const avoid = (allergies ?? '').toLowerCase()
  const safe = RITUALS.filter(
    (r) => !exclude.includes(r.slug) && !r.contains.some((c) => avoid.includes(c)),
  )
  if (safe.length === 0) return null
  // Stable per-day pick: the same night always suggests the same thing.
  const seed = Number(date.replace(/-/g, '')) % safe.length
  return safe[seed]
}
