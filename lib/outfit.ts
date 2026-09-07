import type { Garment, Occasion } from './wardrobe'
import type { Body, LineEffect } from './silhouette'
import { BALANCING, effectLine, horizontalBreaks } from './silhouette'
import type { Season } from './color-season'
import { hexToLab, lightnessOf, nearestSwatch, paletteFit } from './color-season'

/**
 * Putting an outfit together, and being able to say why.
 *
 * This is the part that has to earn its place, because a machine that
 * arranges her clothes without explaining itself is just a slot machine with
 * better photography. Every outfit it proposes comes back with the actual
 * reasoning: how the colours relate, what the lines do, and what it is not
 * sure about.
 *
 * Three things get scored, and they are weighted in the order they matter to
 * the eye from across a room: colour relationship first, then contrast level
 * against her own colouring, then line. Occasion is a filter rather than a
 * score — an outfit for the wrong place is not a low-scoring outfit, it is a
 * different outfit.
 */

export interface Outfit {
  pieces: Garment[]
  score: number
  /** The colour relationship, named. */
  colourStory: string
  /** What the lines are doing on her frame. */
  lineStory: string | null
  /** Anything the engine is genuinely unsure about, said plainly. */
  caveat: string | null
  occasion: Occasion
}

export type Harmony = 'tonal' | 'neutral-anchored' | 'analogous' | 'complementary' | 'unexpected' | 'plain'

const HARMONY_SCORE: Record<Harmony, number> = {
  tonal: 0.95,
  'neutral-anchored': 0.9,
  analogous: 0.85,
  complementary: 0.8,
  plain: 0.7,
  // Not a bad score. A deliberate, high-energy pairing that needs one piece
  // to be clearly smaller than the other — which is a styling note, not a
  // fault in the clothes.
  unexpected: 0.6,
}

export const HARMONY_LABEL: Record<Harmony, string> = {
  tonal: 'one colour, two depths',
  'neutral-anchored': 'a colour against a neutral',
  analogous: 'neighbours on the wheel',
  complementary: 'opposites, on purpose',
  plain: 'quiet',
  unexpected: 'an unexpected interval',
}

/** Chroma in Lab terms — how far from grey a colour is. */
function chromaOf(hex: string): number {
  const lab = hexToLab(hex)
  if (!lab) return 0
  return Math.hypot(lab[1], lab[2])
}

function hueAngle(hex: string): number | null {
  const lab = hexToLab(hex)
  if (!lab) return null
  if (Math.hypot(lab[1], lab[2]) < 12) return null // grey enough to have no hue
  return (Math.atan2(lab[2], lab[1]) * 180) / Math.PI
}

function hueGap(a: number, b: number): number {
  const d = Math.abs(a - b) % 360
  return d > 180 ? 360 - d : d
}

/**
 * How two colours relate.
 *
 * A neutral is defined by its chroma, not by a list of names, so her
 * particular olive or plum-brown is judged the way the eye judges it rather
 * than by whether somebody once wrote it down as a neutral.
 *
 * The band edges were set by measuring real pairs rather than by copying the
 * usual thirty-sixty-ninety wheel, because hue angles in Lab are not evenly
 * spaced and the tidy numbers give wrong answers. Measured: rust and
 * burgundy are 31 apart, dusty blue and soft teal 66, terracotta and sage
 * 72 — all obviously relatives. Red and emerald are 133, royal blue and
 * mustard 153 — obviously opposites. So relatives run to 80 and opposites
 * start at 115.
 *
 * The 80-to-115 band is the genuinely awkward interval, and it only bites
 * when both colours are saturated. Two dusty things that far apart sit down
 * together perfectly well.
 */
export function harmonyOf(a: string | null, b: string | null): Harmony {
  if (!a || !b) return 'plain'
  const ca = chromaOf(a), cb = chromaOf(b)
  const neutralA = ca < 18, neutralB = cb < 18

  if (neutralA && neutralB) return 'plain'
  if (neutralA || neutralB) return 'neutral-anchored'

  const ha = hueAngle(a), hb = hueAngle(b)
  if (ha === null || hb === null) return 'neutral-anchored'

  const gap = hueGap(ha, hb)
  if (gap < 20) {
    // Same hue family. Tonal only when the depths genuinely differ, otherwise
    // the two pieces read as one failed attempt at matching.
    return Math.abs(lightnessOf(a) - lightnessOf(b)) > 18 ? 'tonal' : 'plain'
  }
  if (gap < 80) return 'analogous'
  if (gap > 115) return 'complementary'
  // Both quiet enough that the interval never announces itself.
  if (ca < 40 && cb < 40) return 'analogous'
  return 'unexpected'
}

/**
 * Whether the outfit's own light-to-dark spread matches hers.
 *
 * The most common reason an outfit made entirely of "her colours" still
 * looks wrong. A low-contrast woman in cream and charcoal is wearing two
 * correct colours in a relationship her face cannot answer.
 */
export function contrastFit(pieces: Garment[], season: Season): { score: number; note: string | null } {
  const ls = pieces.map((p) => p.hex).filter(Boolean).map((h) => lightnessOf(h as string))
  if (ls.length < 2) return { score: 0.75, note: null }
  const spread = Math.max(...ls) - Math.min(...ls)

  const want = season.contrast === 'high' ? 55 : season.contrast === 'medium' ? 35 : 18
  const off = Math.abs(spread - want)
  const score = Math.max(0, 1 - off / 55)

  if (off < 15) return { score, note: null }
  if (spread > want) {
    return {
      score,
      note: `The gap between the lightest and darkest piece is wider than your own colouring carries, so the outfit sets the contrast rather than your face.`,
    }
  }
  return {
    score,
    note: `Everything here sits at about the same depth. Your colouring carries more light-to-dark than this, so it may read flatter than you are.`,
  }
}

/**
 * Score and explain one combination.
 *
 * Never returns a verdict — the score orders a list, and what she actually
 * reads is the reasoning. A 0.6 outfit with a good reason is worth more to
 * her than a 0.9 she does not understand.
 */
export function buildOutfit(pieces: Garment[], occasion: Occasion, season: Season, body: Body): Outfit {
  const wearing = pieces.filter((p) => p.layer !== 'bag' && p.layer !== 'jewellery')
  const hexes = wearing.map((p) => p.hex).filter(Boolean) as string[]

  // Colour: the two largest surfaces are what the room sees.
  const primary = wearing.find((p) => p.layer === 'dress' || p.layer === 'top')?.hex ?? hexes[0] ?? null
  const secondary = wearing.find((p) => p.layer === 'bottom')?.hex ?? hexes[1] ?? null
  const harmony = harmonyOf(primary, secondary)

  const fit = hexes.length ? hexes.reduce((a, h) => a + paletteFit(h, season), 0) / hexes.length : 0.6
  const contrast = contrastFit(wearing, season)

  const effects = wearing.flatMap((p) => p.effects) as LineEffect[]
  const balancing = BALANCING[body.shape]
  const lineHits = effects.filter((e) => balancing.includes(e)).length
  const breaks = horizontalBreaks(effects)

  /*
   * Horizontal breaks are the one place where more is reliably worse. Two
   * lines across a body divide it into three, and three parts is where an
   * outfit stops reading as one thing. Petite frames feel it first.
   */
  const breakPenalty = breaks >= 3 ? 0.25 : breaks === 2 && body.scale === 'petite' ? 0.12 : 0
  const lineScore = Math.min(1, 0.6 + lineHits * 0.2) - breakPenalty

  const score =
    HARMONY_SCORE[harmony] * 0.3 + fit * 0.28 + contrast.score * 0.22 + lineScore * 0.2

  const near = primary ? nearestSwatch(primary, season) : null
  const colourStory =
    harmony === 'plain' && near
      ? `Quiet and neutral, sitting close to your ${near.name}.`
      : harmony === 'unexpected'
        ? 'Two saturated colours at an awkward interval — neither relatives nor opposites. It works when one of them is clearly the smaller piece.'
        : `${cap(HARMONY_LABEL[harmony])}${near ? `, anchored near your ${near.name}` : ''}.`

  const lineStory = effectLine(effects, body)

  const caveat =
    contrast.note ??
    (breaks >= 3
      ? 'Three horizontal lines across you — the eye divides you into four and none of the parts gets to be the whole.'
      : fit < 0.35
        ? 'These colours sit outside your palette, which only matters if you want the room looking at your face first. If you love it, wear it.'
        : null)

  return { pieces, score, colourStory, lineStory, caveat, occasion }
}

/**
 * Everything she can build for a given occasion, best first.
 *
 * Capped, because a page of two hundred outfits is a page she closes. It
 * also refuses to return near-identical suggestions — swapping only the
 * shoes is not a second outfit, it is the same outfit with a footnote.
 */
export function suggestOutfits(input: {
  garments: Garment[]
  occasion: Occasion
  season: Season
  body: Body
  limit?: number
}): Outfit[] {
  const { garments, occasion, season, body, limit = 12 } = input
  const forHere = garments.filter((g) => g.occasions.includes(occasion))
  const by = (l: string) => forHere.filter((g) => g.layer === l)

  const combos: Garment[][] = []
  for (const t of by('top')) for (const b of by('bottom')) combos.push([t, b])
  for (const d of by('dress')) combos.push([d])

  const shoes = by('shoes')
  const withShoes = combos.flatMap((c) => (shoes.length ? shoes.map((s) => [...c, s]) : [c]))

  const scored = withShoes
    .map((pieces) => buildOutfit(pieces, occasion, season, body))
    .sort((a, b) => b.score - a.score)

  // One outfit per top-and-bottom pairing; the shoe is a detail, not a look.
  const seen = new Set<string>()
  const out: Outfit[] = []
  for (const o of scored) {
    const core = o.pieces
      .filter((p) => p.layer !== 'shoes')
      .map((p) => p.id)
      .sort()
      .join('|')
    if (seen.has(core)) continue
    seen.add(core)
    out.push(o)
    if (out.length >= limit) break
  }
  return out
}

/**
 * One outfit for today, with a reason.
 *
 * The Today engine can ask for this the way it asks Protocols for tonight.
 * It leans towards things she has not worn lately, because the point of
 * seeing her wardrobe on a board is remembering what is in it.
 */
export function outfitForToday(input: {
  garments: Garment[]
  occasion: Occasion
  season: Season
  body: Body
  today: string
}): Outfit | null {
  const all = suggestOutfits({ ...input, limit: 30 })
  if (all.length === 0) return null

  const daysSince = (d: string | null | undefined) =>
    d ? Math.floor((Date.parse(input.today) - Date.parse(d)) / 86_400_000) : 999

  return [...all].sort((a, b) => {
    const rest = (o: Outfit) => Math.min(...o.pieces.map((p) => daysSince(p.lastWornOn)))
    // A small nudge only. A rested outfit that does not work is still an
    // outfit that does not work.
    return b.score + Math.min(rest(b), 60) / 400 - (a.score + Math.min(rest(a), 60) / 400)
  })[0]
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
