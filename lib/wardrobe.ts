import type { LineEffect } from './silhouette'

/**
 * The closet itself — what she owns, and what a capsule is missing.
 *
 * A capsule wardrobe is usually sold as a number. Thirty-three pieces, or
 * whatever. The number is the least interesting part: what makes a wardrobe
 * work is that the pieces combine, and a hundred things that do not combine
 * is a worse wardrobe than fifteen that do. So the only question this file
 * answers is how many real outfits her closet can make, and which one
 * missing piece would make the most new ones.
 *
 * She uploads what she actually owns. Nothing here suggests she buy
 * something she has not asked about, and the gap analysis names the smallest
 * possible addition rather than a shopping list.
 */

export type Layer = 'top' | 'bottom' | 'dress' | 'outer' | 'shoes' | 'bag' | 'jewellery' | 'other'

export const LAYERS: { key: Layer; label: string; plural: string }[] = [
  { key: 'top', label: 'Top', plural: 'tops' },
  { key: 'bottom', label: 'Bottom', plural: 'bottoms' },
  { key: 'dress', label: 'Dress', plural: 'dresses' },
  { key: 'outer', label: 'Layer', plural: 'layers' },
  { key: 'shoes', label: 'Shoes', plural: 'shoes' },
  { key: 'bag', label: 'Bag', plural: 'bags' },
  { key: 'jewellery', label: 'Jewellery', plural: 'jewellery' },
  { key: 'other', label: 'Other', plural: 'other' },
]

/** Where she is actually going. The wardrobe is for a life, not a mood board. */
export type Occasion = 'everyday' | 'work' | 'teaching' | 'filming' | 'event' | 'rest' | 'movement'

export const OCCASIONS: { key: Occasion; label: string; note: string }[] = [
  { key: 'everyday', label: 'Everyday', note: 'school run, errands, the ordinary day' },
  { key: 'work', label: 'Work', note: 'meetings, calls, anything client-facing' },
  { key: 'teaching', label: 'Holding a room', note: 'retreats, workshops, speaking' },
  { key: 'filming', label: 'On camera', note: 'content days' },
  { key: 'event', label: 'Event', note: 'dinners, weddings, anything dressed' },
  { key: 'rest', label: 'Rest', note: 'home, soft clothes' },
  { key: 'movement', label: 'Movement', note: 'walking, training, hiking' },
]

export interface Garment {
  id: string
  name: string
  layer: Layer
  /** The dominant colour, as hex. What the outfit engine reasons about. */
  hex: string | null
  /** Secondary colour when a piece has a real second one — a print, a trim. */
  hex2?: string | null
  /** What it does structurally. Drives every line sentence in the app. */
  effects: LineEffect[]
  occasions: Occasion[]
  /** Warmth, so a February outfit does not put her in linen. */
  warmth?: 'light' | 'mid' | 'warm'
  /** Her own photo of it. The whole point of the board. */
  imageUrl?: string | null
  /** Times worn, from the wear log. Cost per wear needs this. */
  wornCount?: number
  lastWornOn?: string | null
  /** What she paid, when she chose to say. Optional and never nagged for. */
  price?: number | null
  /** Pieces she reaches for regardless of what any engine thinks. */
  loved?: boolean
  notes?: string | null
}

/** What an outfit needs to be an outfit. */
export const REQUIRED_LAYERS: Layer[] = ['shoes']

/**
 * How many distinct outfits this closet can build.
 *
 * Counted rather than estimated: every top × bottom × shoes, plus every
 * dress × shoes, filtered to combinations that share an occasion. The
 * occasion filter is what stops the number being a fantasy — forty tops and
 * forty skirts is not sixteen hundred outfits if half of them are gym
 * clothes.
 */
export function countOutfits(garments: Garment[]): number {
  const by = (l: Layer) => garments.filter((g) => g.layer === l)
  const tops = by('top'), bottoms = by('bottom'), dresses = by('dress'), shoes = by('shoes')
  const shares = (a: Garment, b: Garment) => a.occasions.some((o) => b.occasions.includes(o))

  let n = 0
  for (const t of tops) for (const b of bottoms) {
    if (!shares(t, b)) continue
    n += shoes.filter((s) => shares(s, t) && shares(s, b)).length || 1
  }
  for (const d of dresses) n += shoes.filter((s) => shares(s, d)).length || 1
  return n
}

export interface Gap {
  layer: Layer
  occasion: Occasion
  /** How many new outfits filling this would unlock. */
  unlocks: number
  /** What to look for, in her own palette and her own line vocabulary. */
  looksLike: string
}

/**
 * The one piece that would open up the most.
 *
 * Works by simulating the addition rather than by rule: for every layer and
 * occasion she is short on, it adds a hypothetical neutral piece and counts
 * how many new combinations appear. Whatever unlocks most, wins.
 *
 * Deliberately returns at most three. A gap analysis that returns eleven
 * things is a shopping list, and she asked for a wardrobe she can actually
 * hold in her head.
 */
export function findGaps(garments: Garment[], limit = 3): Gap[] {
  const before = countOutfits(garments)
  const out: Gap[] = []

  const liveOccasions = [...new Set(garments.flatMap((g) => g.occasions))]
  for (const layer of ['top', 'bottom', 'dress', 'shoes', 'outer'] as Layer[]) {
    for (const occasion of liveOccasions) {
      const have = garments.filter((g) => g.layer === layer && g.occasions.includes(occasion)).length
      // Three of something is enough; this is about what is missing.
      if (have >= 3) continue
      const hypothetical: Garment = {
        id: '__test', name: 'test', layer, hex: null, effects: [], occasions: [occasion],
      }
      const unlocks = countOutfits([...garments, hypothetical]) - before
      if (unlocks > 0) out.push({ layer, occasion, unlocks, looksLike: '' })
    }
  }

  return out.sort((a, b) => b.unlocks - a.unlocks).slice(0, limit)
}

/**
 * What she actually wears, versus what she owns.
 *
 * The honest number, and the only one in this file that could sting — so it
 * is phrased as information and never as waste. A dress worn twice a year
 * for something that matters is not a failure of anything.
 */
export function wearStats(garments: Garment[], today: string): {
  neverWorn: Garment[]
  restingSince: { garment: Garment; days: number }[]
  workhorses: Garment[]
} {
  const days = (d: string | null | undefined) =>
    d ? Math.floor((Date.parse(today) - Date.parse(d)) / 86_400_000) : null

  const neverWorn = garments.filter((g) => !g.wornCount)
  const restingSince = garments
    .map((g) => ({ garment: g, days: days(g.lastWornOn) }))
    .filter((x): x is { garment: Garment; days: number } => x.days !== null && x.days >= 90)
    .sort((a, b) => b.days - a.days)
  const workhorses = [...garments]
    .filter((g) => (g.wornCount ?? 0) > 0)
    .sort((a, b) => (b.wornCount ?? 0) - (a.wornCount ?? 0))
    .slice(0, 5)

  return { neverWorn, restingSince, workhorses }
}

/** Cost per wear, when she has told us what a piece cost. */
export function costPerWear(g: Garment): number | null {
  if (g.price == null || !g.wornCount) return null
  return g.price / g.wornCount
}
