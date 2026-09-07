/**
 * Personal colour, as a system rather than a verdict.
 *
 * The twelve-season method is usually sold as an identity — you *are* a Soft
 * Autumn — and then as a list of things you are not allowed to wear. That is
 * the opposite of useful and the opposite of this app. What actually makes a
 * colour work on a person is three measurable relationships between the
 * garment and her own colouring, and once she can see the three, she can
 * judge any colour in any shop without a swatch fan.
 *
 * The three axes:
 *
 *   Hue — whether her colouring leans warm (gold, peach, amber) or cool
 *   (blue, rose, ash). This is the one most people already know about, and
 *   it is the least decisive of the three.
 *
 *   Value — how light or deep her natural colouring is, from hair to skin to
 *   eyes taken together. A deep-valued woman in pale pastels looks washed
 *   into the background; a light-valued woman in charcoal looks swallowed.
 *
 *   Chroma — how clear or muted her colouring is. This is the axis that does
 *   the most work and the one almost nobody is taught. Bright colouring next
 *   to dusty clothes goes flat, and soft colouring next to electric colour
 *   gets shouted over.
 *
 * One of the three always dominates, and that dominant axis is the season's
 * real name. The other two are tiebreakers.
 *
 * Nothing here forbids anything. A colour outside her palette is described
 * by what it does — where the eye goes, what it competes with — because a
 * woman in a colour she loves and feels wonderful in has already won the
 * argument, and the app should never be the thing that tells her otherwise.
 */

export type Hue = 'warm' | 'cool' | 'neutral'
export type Value = 'light' | 'medium' | 'deep'
export type Chroma = 'bright' | 'medium' | 'soft'

export type SeasonKey =
  | 'bright-spring' | 'true-spring' | 'light-spring'
  | 'light-summer' | 'true-summer' | 'soft-summer'
  | 'soft-autumn' | 'true-autumn' | 'deep-autumn'
  | 'deep-winter' | 'true-winter' | 'bright-winter'

export interface Season {
  key: SeasonKey
  name: string
  /** The axis that runs the show. Everything else bends to it. */
  dominant: 'hue' | 'value' | 'chroma'
  hue: Hue
  value: Value
  chroma: Chroma
  /** In one sentence, what this palette is doing. */
  feels: string
  /**
   * How much light-to-dark difference her own colouring carries, which is
   * how much an outfit can carry before it stops looking like her.
   */
  contrast: 'low' | 'medium' | 'high'
  /** Which metals sit down quietly against her skin. */
  metals: string[]
  /** The colours that do the heavy lifting — coats, trousers, bags. */
  neutrals: Swatch[]
  /** The ones that do the talking. */
  colours: Swatch[]
  /** The single colour that looks like her at her best. */
  signature: Swatch
  /** Not forbidden. Described by what it does, so she can decide. */
  fights: { name: string; hex: string; because: string }[]
}

export interface Swatch {
  name: string
  hex: string
}

export const SEASONS: Record<SeasonKey, Season> = {
  'bright-spring': {
    key: 'bright-spring', name: 'Bright Spring', dominant: 'chroma',
    hue: 'warm', value: 'medium', chroma: 'bright', contrast: 'high',
    feels: 'Clear, hot and lit from inside — the colours of a tropical morning.',
    metals: ['bright gold', 'polished brass'],
    neutrals: [
      { name: 'warm ivory', hex: '#FBF3E4' }, { name: 'light camel', hex: '#C9A66B' },
      { name: 'true navy', hex: '#20376B' }, { name: 'warm grey', hex: '#9A928A' },
    ],
    colours: [
      { name: 'coral', hex: '#FF6F5E' }, { name: 'turquoise', hex: '#1FC3C0' },
      { name: 'clear yellow', hex: '#FFD23F' }, { name: 'bright periwinkle', hex: '#6E7BF2' },
      { name: 'hot pink', hex: '#F5407E' }, { name: 'apple green', hex: '#7ED321' },
    ],
    signature: { name: 'coral', hex: '#FF6F5E' },
    fights: [
      { name: 'dusty rose', hex: '#C8A2A2', because: 'the dust in it settles over your colouring instead of meeting it.' },
      { name: 'black', hex: '#111111', because: 'it holds more weight than your own contrast, so it leads and you follow.' },
    ],
  },
  'true-spring': {
    key: 'true-spring', name: 'True Spring', dominant: 'hue',
    hue: 'warm', value: 'medium', chroma: 'bright', contrast: 'medium',
    feels: 'Golden and green and warm all the way through. Nothing in it is cold.',
    metals: ['yellow gold', 'copper'],
    neutrals: [
      { name: 'cream', hex: '#FAF0DC' }, { name: 'camel', hex: '#BE9460' },
      { name: 'warm brown', hex: '#7A5230' }, { name: 'stone', hex: '#B3A692' },
    ],
    colours: [
      { name: 'peach', hex: '#FFB07C' }, { name: 'grass green', hex: '#66B032' },
      { name: 'golden yellow', hex: '#F6C445' }, { name: 'warm coral', hex: '#FF7F50' },
      { name: 'aqua', hex: '#4FC3B0' }, { name: 'poppy', hex: '#E8483C' },
    ],
    signature: { name: 'golden yellow', hex: '#F6C445' },
    fights: [
      { name: 'icy pink', hex: '#F2D5E0', because: 'the blue underneath pulls grey across warm skin.' },
      { name: 'charcoal', hex: '#36393D', because: 'it is heavier than anything in your own colouring.' },
    ],
  },
  'light-spring': {
    key: 'light-spring', name: 'Light Spring', dominant: 'value',
    hue: 'warm', value: 'light', chroma: 'bright', contrast: 'low',
    feels: 'Delicate and sunlit. Everything a shade lighter than you expect.',
    metals: ['light gold', 'rose gold'],
    neutrals: [
      { name: 'ivory', hex: '#FDF6E9' }, { name: 'oatmeal', hex: '#DCCDB4' },
      { name: 'light warm grey', hex: '#BDB3A6' }, { name: 'soft navy', hex: '#4A5D87' },
    ],
    colours: [
      { name: 'apricot', hex: '#FFC49B' }, { name: 'mint', hex: '#A8E6CF' },
      { name: 'butter', hex: '#FFE79A' }, { name: 'coral pink', hex: '#FF9E9E' },
      { name: 'periwinkle', hex: '#A5B4F0' }, { name: 'light aqua', hex: '#8FD9D4' },
    ],
    signature: { name: 'apricot', hex: '#FFC49B' },
    fights: [
      { name: 'black', hex: '#111111', because: 'your own contrast is gentle, so black draws a line where you have none.' },
      { name: 'burgundy', hex: '#5C1A2B', because: 'it is deeper and cooler than anything you carry naturally.' },
    ],
  },
  'light-summer': {
    key: 'light-summer', name: 'Light Summer', dominant: 'value',
    hue: 'cool', value: 'light', chroma: 'medium', contrast: 'low',
    feels: 'Watercolour. Cool, pale and slightly hazy, like early light on water.',
    metals: ['white gold', 'light silver'],
    neutrals: [
      { name: 'soft white', hex: '#F7F7F4' }, { name: 'dove grey', hex: '#C4C6C8' },
      { name: 'greyed navy', hex: '#5B6B87' }, { name: 'cool taupe', hex: '#B6ADA8' },
    ],
    colours: [
      { name: 'powder blue', hex: '#A8C6DE' }, { name: 'rose', hex: '#E9AFBD' },
      { name: 'lilac', hex: '#C3B0DA' }, { name: 'sage', hex: '#AFC3AE' },
      { name: 'soft raspberry', hex: '#C96D89' }, { name: 'pale lemon', hex: '#F0E9A8' },
    ],
    signature: { name: 'powder blue', hex: '#A8C6DE' },
    fights: [
      { name: 'orange', hex: '#F26522', because: 'it has heat and clarity your colouring does not answer.' },
      { name: 'black', hex: '#111111', because: 'it sets a contrast far above your own and the eye reads the black first.' },
    ],
  },
  'true-summer': {
    key: 'true-summer', name: 'True Summer', dominant: 'hue',
    hue: 'cool', value: 'medium', chroma: 'soft', contrast: 'medium',
    feels: 'Cool, blue-based and slightly dusty. Restrained on purpose.',
    metals: ['silver', 'white gold'],
    neutrals: [
      { name: 'soft white', hex: '#F4F4F1' }, { name: 'medium grey', hex: '#9DA2A6' },
      { name: 'navy', hex: '#2F3F5F' }, { name: 'cocoa', hex: '#6E5C57' },
    ],
    colours: [
      { name: 'dusty blue', hex: '#7C9BB8' }, { name: 'rose pink', hex: '#D98CA0' },
      { name: 'plum', hex: '#7A4A6D' }, { name: 'soft teal', hex: '#5E9A97' },
      { name: 'watermelon', hex: '#D96A78' }, { name: 'lavender', hex: '#A99BC7' },
    ],
    signature: { name: 'rose pink', hex: '#D98CA0' },
    fights: [
      { name: 'tomato red', hex: '#E23B23', because: 'the warmth and clarity in it sit forward of your own softness.' },
      { name: 'camel', hex: '#BE9460', because: 'a yellow neutral against cool skin usually reads sallow rather than warm.' },
    ],
  },
  'soft-summer': {
    key: 'soft-summer', name: 'Soft Summer', dominant: 'chroma',
    hue: 'cool', value: 'medium', chroma: 'soft', contrast: 'low',
    feels: 'Everything has a grey veil over it. Quiet, and the quiet is the point.',
    metals: ['brushed silver', 'pewter'],
    neutrals: [
      { name: 'soft white', hex: '#F2F1EC' }, { name: 'greige', hex: '#ADA69C' },
      { name: 'charcoal blue', hex: '#4A5561' }, { name: 'mushroom', hex: '#9B8F87' },
    ],
    colours: [
      { name: 'dusty rose', hex: '#C99BA3' }, { name: 'sage green', hex: '#9CAD98' },
      { name: 'slate blue', hex: '#6F8299' }, { name: 'mauve', hex: '#A98BA0' },
      { name: 'soft burgundy', hex: '#8C5561' }, { name: 'muted teal', hex: '#6C9490' },
    ],
    signature: { name: 'dusty rose', hex: '#C99BA3' },
    fights: [
      { name: 'electric blue', hex: '#0047FF', because: 'pure chroma next to soft colouring wins, and the face comes second.' },
      { name: 'pure white', hex: '#FFFFFF', because: 'it is cleaner than anything in your own colouring, so it can read as glare.' },
    ],
  },
  'soft-autumn': {
    key: 'soft-autumn', name: 'Soft Autumn', dominant: 'chroma',
    hue: 'warm', value: 'medium', chroma: 'soft', contrast: 'low',
    feels: 'Warm and dusty at once — dried flowers, old gold, weathered stone.',
    metals: ['antique gold', 'brushed brass'],
    neutrals: [
      { name: 'oyster', hex: '#EFE7D8' }, { name: 'warm taupe', hex: '#B0A08C' },
      { name: 'coffee', hex: '#6B5546' }, { name: 'olive grey', hex: '#8B8A73' },
    ],
    colours: [
      { name: 'terracotta', hex: '#C77B5A' }, { name: 'sage', hex: '#A3AE8C' },
      { name: 'dusty gold', hex: '#C9A961' }, { name: 'salmon', hex: '#DE9A87' },
      { name: 'muted teal', hex: '#6F9490' }, { name: 'soft aubergine', hex: '#7A5A62' },
    ],
    signature: { name: 'terracotta', hex: '#C77B5A' },
    fights: [
      { name: 'fuchsia', hex: '#E0218A', because: 'the clarity in it is louder than your colouring, so it leads.' },
      { name: 'black', hex: '#111111', because: 'a hard edge against a soft face draws the eye to the edge.' },
    ],
  },
  'true-autumn': {
    key: 'true-autumn', name: 'True Autumn', dominant: 'hue',
    hue: 'warm', value: 'medium', chroma: 'medium', contrast: 'medium',
    feels: 'Rich and earthed. Spice, rust, forest, amber.',
    metals: ['gold', 'bronze', 'copper'],
    neutrals: [
      { name: 'cream', hex: '#F5EAD5' }, { name: 'camel', hex: '#B98A54' },
      { name: 'chocolate', hex: '#553824' }, { name: 'olive', hex: '#7A7A44' },
    ],
    colours: [
      { name: 'rust', hex: '#B5502E' }, { name: 'forest green', hex: '#3F6B45' },
      { name: 'mustard', hex: '#D0A032' }, { name: 'brick', hex: '#A03D34' },
      { name: 'teal', hex: '#2E7C7A' }, { name: 'pumpkin', hex: '#DB7128' },
    ],
    signature: { name: 'rust', hex: '#B5502E' },
    fights: [
      { name: 'icy pink', hex: '#F2D5E0', because: 'nothing in your colouring answers a cold pastel, so it floats.' },
      { name: 'pure white', hex: '#FFFFFF', because: 'a blue-white next to golden skin usually pulls grey into it.' },
    ],
  },
  'deep-autumn': {
    key: 'deep-autumn', name: 'Deep Autumn', dominant: 'value',
    hue: 'warm', value: 'deep', chroma: 'medium', contrast: 'high',
    feels: 'Warm and dark and expensive. Mahogany, port, deep forest.',
    metals: ['antique gold', 'dark bronze'],
    neutrals: [
      { name: 'ecru', hex: '#EDE2CC' }, { name: 'dark chocolate', hex: '#3E2A1E' },
      { name: 'deep olive', hex: '#4E4E2E' }, { name: 'espresso', hex: '#2B1D16' },
    ],
    colours: [
      { name: 'burnt orange', hex: '#B2521F' }, { name: 'deep teal', hex: '#1F5C5E' },
      { name: 'burgundy', hex: '#6E2231' }, { name: 'moss', hex: '#4A5F2A' },
      { name: 'marigold', hex: '#D89027' }, { name: 'aubergine', hex: '#4A2A3D' },
    ],
    signature: { name: 'burgundy', hex: '#6E2231' },
    fights: [
      { name: 'pastel blue', hex: '#BFD9EC', because: 'it is far lighter than your own depth, so your face reads darker than the clothes.' },
      { name: 'dusty lilac', hex: '#C3B0DA', because: 'cool and hazy at once, which is two axes away from you.' },
    ],
  },
  'deep-winter': {
    key: 'deep-winter', name: 'Deep Winter', dominant: 'value',
    hue: 'cool', value: 'deep', chroma: 'medium', contrast: 'high',
    feels: 'Dark and jewelled. Midnight, pine, wine, ice.',
    metals: ['silver', 'gunmetal', 'white gold'],
    neutrals: [
      { name: 'pure white', hex: '#FFFFFF' }, { name: 'black', hex: '#111111' },
      { name: 'charcoal', hex: '#33363B' }, { name: 'true navy', hex: '#1B2A4A' },
    ],
    colours: [
      { name: 'wine', hex: '#6B1F38' }, { name: 'pine green', hex: '#14503F' },
      { name: 'sapphire', hex: '#1C3F76' }, { name: 'magenta', hex: '#A6236B' },
      { name: 'deep purple', hex: '#452A63' }, { name: 'true red', hex: '#B21030' },
    ],
    signature: { name: 'wine', hex: '#6B1F38' },
    fights: [
      { name: 'camel', hex: '#BE9460', because: 'a warm mid neutral sits below your depth and above your warmth at the same time.' },
      { name: 'peach', hex: '#FFB07C', because: 'light and warm together is the far corner from where you live.' },
    ],
  },
  'true-winter': {
    key: 'true-winter', name: 'True Winter', dominant: 'hue',
    hue: 'cool', value: 'deep', chroma: 'bright', contrast: 'high',
    feels: 'Icy and pure. No gold anywhere, and nothing muddied.',
    metals: ['silver', 'platinum'],
    neutrals: [
      { name: 'pure white', hex: '#FFFFFF' }, { name: 'black', hex: '#0D0D0D' },
      { name: 'true navy', hex: '#16264C' }, { name: 'cool grey', hex: '#8E9399' },
    ],
    colours: [
      { name: 'true red', hex: '#C8102E' }, { name: 'royal blue', hex: '#1552B8' },
      { name: 'emerald', hex: '#0B7A54' }, { name: 'fuchsia', hex: '#D2197C' },
      { name: 'icy pink', hex: '#F4D7E3' }, { name: 'violet', hex: '#6A2FA0' },
    ],
    signature: { name: 'true red', hex: '#C8102E' },
    fights: [
      { name: 'rust', hex: '#B5502E', because: 'it is warm and softened, and both of those work against a clear cool palette.' },
      { name: 'olive', hex: '#7A7A44', because: 'yellow-green next to blue-based skin tends to grey it.' },
    ],
  },
  'bright-winter': {
    key: 'bright-winter', name: 'Bright Winter', dominant: 'chroma',
    hue: 'cool', value: 'medium', chroma: 'bright', contrast: 'high',
    feels: 'Electric. Cool colours turned all the way up.',
    metals: ['silver', 'chrome'],
    neutrals: [
      { name: 'pure white', hex: '#FFFFFF' }, { name: 'black', hex: '#0D0D0D' },
      { name: 'true navy', hex: '#182B57' }, { name: 'light true grey', hex: '#A9AEB3' },
    ],
    colours: [
      { name: 'hot pink', hex: '#F01E6E' }, { name: 'electric blue', hex: '#0F5FE8' },
      { name: 'emerald', hex: '#00875A' }, { name: 'lemon ice', hex: '#F3F1A8' },
      { name: 'true red', hex: '#D0102F' }, { name: 'turquoise', hex: '#00B7C7' },
    ],
    signature: { name: 'hot pink', hex: '#F01E6E' },
    fights: [
      { name: 'dusty sage', hex: '#A3AE8C', because: 'muted colour beside bright colouring reads as tired rather than calm.' },
      { name: 'terracotta', hex: '#C77B5A', because: 'warm and softened at once — the opposite corner from you.' },
    ],
  },
}

export const SEASON_LIST = Object.values(SEASONS)

/**
 * Work out the season from the three axes.
 *
 * The dominant axis names the season and the other two place it. This is
 * deliberately the same logic a good analyst uses out loud, so a woman who
 * has already been draped can check it against what she was told — and if it
 * disagrees, she overrules it. She was in the room and this is arithmetic.
 */
export function seasonFrom(
  hue: Hue,
  value: Value,
  chroma: Chroma,
  /**
   * Which axis is furthest from the middle, when the caller knows.
   *
   * Without this, deep and bright together always resolved to a deep season,
   * so a woman with deep colouring and real clarity could never land on a
   * bright one however clear she was. That is a genuine fault in the
   * arithmetic and it fell hardest on women with deep skin, who got sorted
   * into two of the twelve seasons no matter what else was true about them.
   *
   * The photo analysis measures how extreme each axis actually is and says
   * which one wins. The three-question version has no way to know, so it
   * keeps the old order — value first, then chroma — which is the
   * conventional reading and is right more often than not.
   */
  dominant?: 'value' | 'chroma',
): SeasonKey {
  const warm = hue === 'warm'
  const brightSeason = (): SeasonKey => (warm ? 'bright-spring' : 'bright-winter')
  const softSeason = (): SeasonKey => (warm ? 'soft-autumn' : 'soft-summer')
  const lightSeason = (): SeasonKey => (warm ? 'light-spring' : 'light-summer')
  const deepSeason = (): SeasonKey => (warm ? 'deep-autumn' : 'deep-winter')

  const valueIsExtreme = value !== 'medium'
  const chromaIsExtreme = chroma !== 'medium'

  // Both axes are extreme and we have been told which one runs the show.
  if (valueIsExtreme && chromaIsExtreme && dominant) {
    if (dominant === 'chroma') return chroma === 'bright' ? brightSeason() : softSeason()
    return value === 'light' ? lightSeason() : deepSeason()
  }

  // Chroma leads: the extremes of clear and muted.
  if (chromaIsExtreme && !valueIsExtreme) return chroma === 'bright' ? brightSeason() : softSeason()

  // Value leads: the extremes of light and deep.
  if (value === 'light') return lightSeason()
  if (value === 'deep') return deepSeason()

  // Nothing extreme — hue leads, and chroma places it within the family.
  if (warm) return chroma === 'bright' ? 'true-spring' : 'true-autumn'
  return chroma === 'bright' ? 'true-winter' : 'true-summer'
}

export function getSeason(key: string | null | undefined): Season | null {
  if (!key) return null
  return SEASONS[key as SeasonKey] ?? null
}

/** Every colour she has, palette and neutrals together. */
export function paletteOf(season: Season): Swatch[] {
  return [...season.neutrals, ...season.colours]
}

/**
 * How well a garment colour sits in her palette, 0 to 1.
 *
 * Nearest-neighbour in a perceptual-ish space rather than plain RGB
 * distance, because two colours can be numerically close and look nothing
 * alike. Not a grade — it feeds the outfit engine's reasoning, and the
 * wording it produces is always about what the colour does.
 */
export function paletteFit(hex: string, season: Season): number {
  const target = hexToLab(hex)
  if (!target) return 0.5
  let best = Infinity
  for (const s of paletteOf(season)) {
    const lab = hexToLab(s.hex)
    if (!lab) continue
    const d = Math.hypot(lab[0] - target[0], lab[1] - target[1], lab[2] - target[2])
    if (d < best) best = d
  }
  // ~40 in Lab is where two colours stop reading as relatives.
  return Math.max(0, Math.min(1, 1 - best / 60))
}

/** The closest thing in her palette to a colour she is looking at. */
export function nearestSwatch(hex: string, season: Season): Swatch | null {
  const target = hexToLab(hex)
  if (!target) return null
  let best: { s: Swatch; d: number } | null = null
  for (const s of paletteOf(season)) {
    const lab = hexToLab(s.hex)
    if (!lab) continue
    const d = Math.hypot(lab[0] - target[0], lab[1] - target[1], lab[2] - target[2])
    if (!best || d < best.d) best = { s, d }
  }
  return best?.s ?? null
}

/** Lightness 0–100, which is what contrast is actually measured in. */
export function lightnessOf(hex: string): number {
  return hexToLab(hex)?.[0] ?? 50
}

export function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return null
  const n = parseInt(m[1], 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** sRGB → CIELAB, D65. Enough for judging whether two colours are relatives. */
export function hexToLab(hex: string): [number, number, number] | null {
  const rgb = hexToRgb(hex)
  if (!rgb) return null
  const lin = rgb.map((v) => {
    const c = v / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  const [r, g, b] = lin
  const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047
  const y = r * 0.2126 + g * 0.7152 + b * 0.0722
  const z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116)
  const fx = f(x), fy = f(y), fz = f(z)
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)]
}
