/**
 * Line, proportion and what a cut actually does.
 *
 * Every version of this I have ever read is a list of prohibitions, and the
 * prohibitions are always aimed at making a woman look like a different
 * woman — narrower here, longer there, less of whatever she has most of.
 * That is not what this is.
 *
 * The mechanism is simple and it is not about size. Clothes draw lines on a
 * body: a hem is a horizontal line, a neckline is a shape around the face, a
 * seam is a vertical. The eye goes to lines, and it goes hardest to where two
 * lines meet or where one stops. So the only real question a garment answers
 * is *where does this send the eye*, and the only real skill is deciding
 * where she wants it to go.
 *
 * Which means everything in this file is written as an effect, never as a
 * rule. "A cropped jacket puts a line at your natural waist" is a fact she
 * can use. "Don't wear cropped jackets" is somebody's opinion wearing a fact
 * as a costume, and it does not belong in this app.
 */

export type Shape = 'balanced' | 'shoulder-led' | 'hip-led' | 'straight' | 'soft-centre'
export type VerticalProportion = 'long-torso' | 'even' | 'long-leg'
export type Scale = 'petite' | 'average' | 'tall'

export interface ShapeProfile {
  key: Shape
  name: string
  /** In plain words, what is going on structurally. */
  reads: string
  /** Where the eye naturally lands already. */
  restsAt: string
  /**
   * What tends to be true when a woman with this frame likes how something
   * looks. Not rules — observations she can test against her own mirror.
   */
  worksBecause: string[]
}

export const SHAPES: Record<Shape, ShapeProfile> = {
  balanced: {
    key: 'balanced', name: 'Balanced',
    reads: 'Shoulders and hips are close to the same width, with a defined middle.',
    restsAt: 'the waist',
    worksBecause: [
      'Your frame already has a strong horizontal at the waist, so a garment that follows it is agreeing with a line that exists rather than drawing a new one.',
      'Wrap, belt and seam-shaped pieces track that line without adding bulk on top of it.',
      'A straight column hides the line entirely, which is a real choice and sometimes the one you want — it reads calmer and more architectural.',
    ],
  },
  'shoulder-led': {
    key: 'shoulder-led', name: 'Shoulder-led',
    reads: 'Shoulders or bust are the widest horizontal; the hip is narrower.',
    restsAt: 'the shoulder line',
    worksBecause: [
      'Volume low — a full skirt, wide leg, a patch pocket at the hip — puts weight at the narrow end and evens the two horizontals.',
      'An open or V neckline makes a vertical inside a wide horizontal, which is why it changes the whole top half more than a different sleeve would.',
      'Detail up high (a puff sleeve, a big collar, a bold shoulder) amplifies the line you already lead with. Sometimes that is exactly the point.',
    ],
  },
  'hip-led': {
    key: 'hip-led', name: 'Hip-led',
    reads: 'Hips are the widest horizontal; shoulders are narrower.',
    restsAt: 'the hip',
    worksBecause: [
      'Anything that widens the shoulder — a boat neck, a structured shoulder, a horizontal stripe up top — meets the hip across the diagonal.',
      'Colour is the fastest tool you have: the lighter or brighter half is the half the eye reads first, wherever you put it.',
      'A darker, quieter bottom half with something happening at the neckline is the whole trick, and it is one decision rather than a wardrobe.',
    ],
  },
  straight: {
    key: 'straight', name: 'Straight',
    reads: 'Shoulders, waist and hip sit close in width — a long, clean vertical.',
    restsAt: 'the full length of you',
    worksBecause: [
      'Your frame is a vertical, so anything that creates a curve is inventing one: a belt, a peplum, a bias cut, a wrap.',
      'It is also the frame that carries a pure column better than any other — tailoring, a long coat, a slip dress hang off you instead of fighting you.',
      'Layers work unusually well because you have length to divide up and no width competing for it.',
    ],
  },
  'soft-centre': {
    key: 'soft-centre', name: 'Soft-centre',
    reads: 'The middle is the fullest part; shoulders and legs are often the finer ones.',
    restsAt: 'the centre',
    worksBecause: [
      'An unbroken vertical through the middle — an open shirt, a long cardigan, a column of one colour — gives the eye somewhere to travel instead of somewhere to stop.',
      'Empire and just-under-bust lines put the horizontal above the fullest point, which is a different decision from hiding it.',
      'Legs and neckline are usually the easiest things to show, and showing something is what stops an outfit reading as concealment.',
    ],
  },
}

export const VERTICAL: Record<VerticalProportion, { name: string; note: string }> = {
  'long-torso': {
    name: 'Longer through the body',
    note: 'A high waistband moves the apparent split upward and hands the length back to your legs. This is the single highest-leverage change on your whole frame.',
  },
  even: {
    name: 'Evenly split',
    note: 'You can place a waistline almost anywhere, which is freedom rather than an absence — pick the line to suit the outfit rather than your frame.',
  },
  'long-leg': {
    name: 'Longer through the leg',
    note: 'A lower or dropped waist, a longer top, an untucked shirt all give the torso back some length. Very high waists can shorten the top half sharply.',
  },
}

export const SCALES: Record<Scale, { name: string; note: string }> = {
  petite: {
    name: 'Petite',
    note: 'Fewer horizontal breaks means more apparent length. Not smaller clothes — fewer lines across you, and the ones you keep placed on purpose.',
  },
  average: { name: 'Average', note: 'Most proportions read as intended, so the deciding factor is usually the line rather than the length.' },
  tall: {
    name: 'Tall',
    note: 'You have length to divide and it usually looks better divided. Contrast between halves, a defined waist and longer lines all have somewhere to go.',
  },
}

/**
 * What a garment does, structurally.
 *
 * The vocabulary the outfit engine reasons in. Every garment gets tagged
 * with these when it goes into the closet, and everything the engine says
 * later is assembled from them, so it can always explain itself.
 */
export type LineEffect =
  | 'waist-line'        // a horizontal at the natural waist
  | 'high-line'         // a horizontal above the waist
  | 'low-line'          // a horizontal at or below the hip
  | 'vertical'          // an unbroken up-and-down
  | 'widens-shoulder'
  | 'widens-hip'
  | 'narrows-shoulder'
  | 'open-neck'         // a V, scoop or open collar
  | 'closed-neck'
  | 'volume-up'
  | 'volume-down'
  | 'skims'             // follows without gripping
  | 'structured'

export const EFFECT_LABEL: Record<LineEffect, string> = {
  'waist-line': 'draws a line at your waist',
  'high-line': 'draws a line above your waist',
  'low-line': 'draws a line at your hip',
  vertical: 'runs an unbroken vertical',
  'widens-shoulder': 'widens the shoulder',
  'widens-hip': 'adds width at the hip',
  'narrows-shoulder': 'narrows the shoulder',
  'open-neck': 'opens the neckline',
  'closed-neck': 'closes the neckline',
  'volume-up': 'puts volume up top',
  'volume-down': 'puts volume low',
  skims: 'skims rather than grips',
  structured: 'holds a structured shape',
}

/**
 * Which effects tend to balance a given frame.
 *
 * "Balance" here means the two horizontals reading closer to each other — it
 * is a describable visual result, not an improvement. A woman who wants to
 * lead with her shoulders is not doing it wrong, and the engine says so.
 */
export const BALANCING: Record<Shape, LineEffect[]> = {
  balanced: ['waist-line', 'skims'],
  'shoulder-led': ['volume-down', 'widens-hip', 'open-neck', 'narrows-shoulder'],
  'hip-led': ['widens-shoulder', 'volume-up', 'structured'],
  straight: ['waist-line', 'volume-down', 'structured'],
  'soft-centre': ['vertical', 'high-line', 'open-neck', 'skims'],
}

/** The opposite: effects that lean into the frame rather than evening it. */
export const AMPLIFYING: Record<Shape, LineEffect[]> = {
  balanced: ['vertical'],
  'shoulder-led': ['volume-up', 'widens-shoulder'],
  'hip-led': ['volume-down', 'widens-hip'],
  straight: ['vertical'],
  'soft-centre': ['waist-line'],
}

export interface Body {
  shape: Shape
  vertical: VerticalProportion
  scale: Scale
}

/**
 * What this garment does on this body, in one sentence.
 *
 * Always phrased as an effect and always neutral about whether the effect is
 * wanted. "Puts volume low, which evens your shoulder line" leaves her the
 * decision. That is the whole design principle of this file.
 */
export function effectLine(effects: LineEffect[], body: Body): string | null {
  if (effects.length === 0) return null
  const balancing = BALANCING[body.shape]
  const amplifying = AMPLIFYING[body.shape]

  const hit = effects.find((e) => balancing.includes(e))
  if (hit) return `${cap(EFFECT_LABEL[hit])}, which evens out ${SHAPES[body.shape].restsAt}.`

  /*
   * Vertical proportion is checked before amplifying, and the order is the
   * whole point.
   *
   * A high waistband on a hip-led, long-torsoed woman is the single highest
   * leverage thing in her wardrobe — and the first version of this function
   * threw that away to tell her the trousers had volume at the hip, which
   * she can see. Say the useful thing, not the first true thing.
   */
  if (effects.includes('high-line') && body.vertical === 'long-torso') {
    return 'Draws the line high, which hands length back to your legs.'
  }
  if (effects.includes('low-line') && body.vertical === 'long-leg') {
    return 'Draws the line low, which gives your torso back some length.'
  }

  const amp = effects.find((e) => amplifying.includes(e))
  if (amp) return `${cap(EFFECT_LABEL[amp])} — leans into ${SHAPES[body.shape].restsAt} rather than evening it.`

  if (effects.includes('waist-line') && body.scale === 'petite') {
    return 'Draws a line at your waist — one horizontal, placed on purpose.'
  }

  return `${cap(EFFECT_LABEL[effects[0]])}.`
}

/**
 * Read the line effects out of what she called the thing.
 *
 * Thirteen checkboxes per garment is a wardrobe nobody ever finishes
 * entering, and she has said more than once that she wants one, two, done.
 * So a "cropped linen jacket" arrives already knowing it draws a line at the
 * waist, and she can correct it in one tap if it guessed wrong.
 *
 * Order matters here the same way it does in the hair engine: the more
 * specific phrase has to win. "High-waisted wide leg" is both a high line
 * and volume low, and a plain "wide leg" is only the second.
 */
export function inferEffects(name: string, layer: string): LineEffect[] {
  const n = ` ${name.toLowerCase()} `
  const has = (...words: string[]) => words.some((w) => n.includes(w))
  const out = new Set<LineEffect>()

  // Where the horizontal lands.
  if (has('high wai', 'high-wai', 'highwai', 'empire')) out.add('high-line')
  if (has('crop', 'bolero', 'shrug')) out.add('waist-line')
  if (has('belt', 'wrap', 'corset', 'cinch', 'peplum')) out.add('waist-line')
  if (has('low rise', 'low-rise', 'drop wai', 'dropped wai', 'hip slung')) out.add('low-line')
  if (has('tunic', 'longline', 'long line', 'duster', 'maxi cardi')) out.add('vertical')

  // Volume, up and down.
  if (has('wide leg', 'wide-leg', 'palazzo', 'flare', 'a-line', 'a line', 'circle skirt', 'full skirt', 'tiered', 'culotte'))
    out.add('volume-down')
  if (has('puff', 'balloon sleeve', 'bishop', 'ruffle sleeve', 'shoulder pad', 'power shoulder'))
    out.add('volume-up')

  // Shoulder line.
  if (has('boat neck', 'bateau', 'off shoulder', 'off-shoulder', 'halter neck', 'square neck', 'structured shoulder'))
    out.add('widens-shoulder')
  if (has('raglan', 'dolman', 'halter', 'cami', 'racer')) out.add('narrows-shoulder')

  // Neckline.
  if (has('v-neck', 'v neck', 'scoop', 'plunge', 'open collar', 'wrap', 'surplice', 'cowl'))
    out.add('open-neck')
  if (has('turtleneck', 'turtle neck', 'roll neck', 'crew neck', 'mock neck', 'high neck'))
    out.add('closed-neck')

  // How it holds itself.
  if (has('blazer', 'tailored', 'structured', 'trench', 'suit', 'denim jacket')) out.add('structured')
  if (has('slip', 'bias', 'drape', 'jersey', 'knit', 'silk', 'flowy', 'relaxed', 'oversized')) out.add('skims')

  // A long column of anything reads as a vertical.
  if (has('maxi', 'column', 'jumpsuit', 'long coat', 'floor length')) out.add('vertical')

  // Sensible defaults so nothing arrives with no opinion at all.
  if (out.size === 0) {
    if (layer === 'outer') out.add('structured')
    else if (layer === 'top' || layer === 'dress' || layer === 'bottom') out.add('skims')
  }

  return [...out]
}

/** How many horizontal breaks an outfit puts across her. */
export function horizontalBreaks(effects: LineEffect[]): number {
  return effects.filter((e) => e === 'waist-line' || e === 'high-line' || e === 'low-line').length
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
