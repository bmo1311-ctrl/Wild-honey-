/**
 * What a life stage should actually change.
 *
 * Until now, telling the app you were trying to conceive did exactly one
 * thing: it warned you off retinol. A woman working towards a pregnancy got
 * a list of things not to put on her face and nothing at all about the goal
 * she had just named.
 *
 * Meanwhile the food log already counts folate on 343 foods, iron on 373,
 * B12 on 204 and choline on 329 — the exact nutrients that matter most for
 * that stage, sitting there unread.
 *
 * So this connects what she logs to what she said she is doing. It counts;
 * it does not prescribe. Every number here is a widely published general
 * reference intake for adult women, not a personalised target, and the copy
 * says so every time it appears.
 */

export type LifeStage = 'pregnant' | 'trying' | 'breastfeeding' | 'none' | null | undefined

export interface FocusNutrient {
  /** Matches the keys stored on food_items.nutrients. */
  key: string
  label: string
  unit: string
  /** A general published reference intake for this stage. Not her target. */
  reference: number
  /** Why it matters here, in one sentence. */
  why: string
  /** Foods in the library that carry a lot of it. */
  found: string
}

interface StageFocus {
  title: string
  /** One line on what this stage is for. */
  blurb: string
  nutrients: FocusNutrient[]
  /** Said before any number is shown. */
  caveat: string
}

const FOLATE: FocusNutrient = {
  key: 'folate_mcg',
  label: 'Folate',
  unit: 'mcg',
  reference: 600,
  why: 'The one most guidance agrees on, and the one that matters earliest — often before a pregnancy is known about.',
  found: 'lentils, spinach, asparagus, oranges, fortified cereal',
}

const IRON: FocusNutrient = {
  key: 'iron_mg',
  label: 'Iron',
  unit: 'mg',
  reference: 27,
  why: 'Blood volume rises considerably, and iron is the nutrient most often found short.',
  found: 'lentils, red meat, pumpkin seeds, spinach, fortified cereal',
}

const CHOLINE: FocusNutrient = {
  key: 'choline_mg',
  label: 'Choline',
  unit: 'mg',
  reference: 450,
  why: 'Widely under-consumed and largely absent from prenatal supplements, so it is worth watching in food.',
  found: 'eggs, salmon, chicken, beef, cottage cheese',
}

const B12: FocusNutrient = {
  key: 'vit_b12_mcg',
  label: 'B12',
  unit: 'mcg',
  reference: 2.6,
  why: 'Comes almost entirely from animal foods, so worth watching closely on a plant-based diet.',
  found: 'salmon, beef, eggs, dairy, fortified cereal',
}

const CALCIUM: FocusNutrient = {
  key: 'calcium_mg',
  label: 'Calcium',
  unit: 'mg',
  reference: 1000,
  why: 'Drawn on steadily, and from your own stores if intake is short.',
  found: 'yoghurt, milk, cheese, kale, fortified milks',
}

export const STAGE_FOCUS: Record<'trying' | 'pregnant' | 'breastfeeding', StageFocus> = {
  trying: {
    title: 'While you are trying',
    blurb:
      'Folate is the one worth building up before rather than after — much of what it does happens in the first few weeks, often before anyone knows.',
    nutrients: [
      { ...FOLATE, reference: 400 },
      { ...IRON, reference: 18 },
      CHOLINE,
      B12,
    ],
    caveat:
      'General reference intakes for adult women, counted from what you logged. Not a personal target, and not a substitute for a supplement your doctor has recommended — most guidance suggests starting folic acid before conception, and that conversation belongs with them.',
  },
  pregnant: {
    title: 'While you are pregnant',
    blurb: 'What you are logging, against the nutrients most often discussed at this stage.',
    nutrients: [FOLATE, IRON, CHOLINE, B12, CALCIUM],
    caveat:
      'General reference intakes, counted from what you logged. Your midwife or doctor sets your actual targets — they know your bloods and your history, and this does not.',
  },
  breastfeeding: {
    title: 'While you are feeding',
    blurb: 'Needs stay high, and they change shape — several go up rather than down.',
    nutrients: [
      { ...FOLATE, reference: 500 },
      { ...IRON, reference: 9, why: 'Requirements usually fall back, though stores may still need rebuilding.' },
      { ...CHOLINE, reference: 550 },
      { ...B12, reference: 2.8 },
      CALCIUM,
    ],
    caveat:
      'General reference intakes, counted from what you logged. If you are tired in a way that rest does not touch, that is worth raising with a doctor rather than solving with food alone.',
  },
}

export function focusFor(stage: LifeStage): StageFocus | null {
  if (!stage || stage === 'none') return null
  return STAGE_FOCUS[stage] ?? null
}

export interface FocusReading {
  nutrient: FocusNutrient
  got: number
  /** Share of the reference intake, capped at 1 for the bar. */
  share: number
}

/**
 * Read today's totals against the stage.
 *
 * Deliberately returns amounts rather than verdicts. Nothing here says short,
 * low, or not enough — one day's food is not a diagnosis, and a woman doing
 * this well can still have an ordinary Tuesday.
 */
export function readFocus(stage: LifeStage, totals: Record<string, number>): FocusReading[] {
  const focus = focusFor(stage)
  if (!focus) return []
  return focus.nutrients.map((n) => {
    const got = totals[n.key] ?? 0
    return { nutrient: n, got, share: Math.min(1, n.reference > 0 ? got / n.reference : 0) }
  })
}
