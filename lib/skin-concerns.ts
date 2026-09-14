/**
 * What she is actually working on, treated from both directions.
 *
 * Protocols could tell her which serum belonged to tonight, but never what
 * she was trying to change. A woman with dark spots and a woman with an
 * angry, reactive barrier were handed the same engine — and skin is one of
 * the few places where the right answer for one is genuinely the wrong
 * answer for the other.
 *
 * So: concerns, chosen by her. Each one connects what already exists in this
 * app rather than restating it — the actives in lib/actives.ts, the acids in
 * lib/acids.ts, the herbs in lib/apothecary.ts, and the nutrients the food
 * library already counts across 407 foods.
 *
 * The inside half is the part she asked for and the part most apps get
 * wrong, so it is written under a rule: say how strong the evidence actually
 * is, every time. Some of these links are well established and some are
 * thin, and a woman changing her diet deserves to know which she is acting
 * on. Nothing here treats, cures or prevents anything.
 *
 * And none of it diagnoses. These are things a person can decide describes
 * their skin, not conditions the app has decided they have. Every concern
 * names the point at which this stops being a skincare question and becomes
 * one for someone who can look at her face in person.
 */

import { APOTHECARY, type Herb } from './apothecary'

export type ConcernKey =
  | 'lines'
  | 'dark-spots'
  | 'breakouts'
  | 'redness'
  | 'texture'
  | 'dryness'
  | 'everything'

/** How much to trust the inside-out link. Stated, never implied. */
export type Evidence = 'good' | 'mixed' | 'thin'

export const EVIDENCE_LABEL: Record<Evidence, string> = {
  good: 'well established',
  mixed: 'mixed evidence',
  thin: 'traditional use, thin evidence',
}

export interface InsideSupport {
  /**
   * Nutrient keys as used by lib/nutrients.ts — and only ones the food log
   * can genuinely count.
   *
   * Omega-3 is deliberately absent from every list here despite mattering to
   * several of these concerns: nothing in this app tracks it, and putting an
   * uncountable key in this array would promise a number that can never
   * appear. It lives in `foods` and in `why` instead, where it is a
   * recommendation rather than a measurement.
   */
  nutrients: string[]
  /** Foods she can search in the library and log. */
  foods: string[]
  /** Keys into lib/apothecary.ts. Never a new herb list. */
  herbs: string[]
  /** Why this matters here, in one honest sentence. */
  why: string
  evidence: Evidence
}

export interface Concern {
  key: ConcernKey
  name: string
  /** What she might call it herself. */
  alsoCalled: string
  /** What it is, without pretending to know what hers is. */
  what: string
  /** Active keys from lib/actives.ts. */
  actives: string[]
  /** Acid keys from lib/acids.ts. Empty where acids are not the answer. */
  acids: string[]
  /** The thing most likely to be making it worse. */
  watchFor: string
  inside: InsideSupport
  /** How long before judging whether it is working. */
  patience: string
  /** When to stop and ask someone who can see her skin. */
  seeSomeone: string
}

export const CONCERNS: Concern[] = [
  {
    key: 'lines',
    name: 'Fine lines and firmness',
    alsoCalled: 'wrinkles, crepiness, losing bounce',
    what: 'Collagen and elastin thin with time, and faster with sun and smoking. The lines that appear where you move your face are different from the ones that stay when it is still — the second kind is what topical work can reach.',
    actives: ['retinoid', 'vitamin-c', 'peptides', 'spf'],
    acids: ['glycolic', 'lactic'],
    watchFor: 'Sun, by a distance. Most of what gets called ageing is photoageing, and nothing in a bottle outperforms not getting it in the first place.',
    inside: {
      nutrients: ['vit_c_mg', 'protein_g'],
      foods: ['bell peppers', 'citrus', 'kiwi', 'berries', 'eggs', 'salmon', 'lentils'],
      herbs: ['rosehip', 'matcha'],
      why: 'Vitamin C is a required cofactor for building collagen — the body genuinely cannot make it without, which is what scurvy is. Collagen is protein, so protein is the raw material. That biochemistry is not in doubt. Whether eating more than enough of either softens a line is an entirely different question, and the answer is that nobody has shown it does.',
      evidence: 'mixed',
    },
    patience: 'Three months before judging a retinoid, and closer to six for firmness. Anything promising faster is selling something.',
    seeSomeone: 'If a line, patch or mole changes shape, colour or texture on its own, that is a dermatologist question and not a skincare one.',
  },
  {
    key: 'dark-spots',
    name: 'Dark spots and uneven tone',
    alsoCalled: 'hyperpigmentation, sun spots, melasma, marks left after a spot',
    what: 'Pigment made in response to something — sun, inflammation, hormones. The cause matters enormously, because a mark left behind by a spot fades on its own and melasma does not behave that way at all.',
    actives: ['vitamin-c', 'niacinamide', 'azelaic-acid', 'retinoid', 'spf'],
    acids: ['mandelic', 'azelaic', 'lactic'],
    watchFor: 'Sun again, and picking. Both make the exact thing you are treating. Daily SPF is not optional here — without it the rest is bailing out a boat with the hole still open.',
    inside: {
      nutrients: ['vit_c_mg', 'vit_e_mg', 'selenium_mcg'],
      foods: ['bell peppers', 'citrus', 'almonds', 'sunflower seeds', 'leafy greens', 'brazil nuts — one or two, not a handful'],
      herbs: ['matcha', 'rosehip'],
      why: 'Antioxidants reduce some of the oxidative damage that drives pigment production. Topical vitamin C works on pigment by a different route — it interferes with tyrosinase, the enzyme that makes melanin — so eating antioxidants does not do what putting ascorbic acid on your face does. Eating them is sensible and supportive; it is not a treatment for an existing spot. One caution on the list: brazil nuts are extraordinarily high in selenium, one or two a day is plenty, and a daily handful can genuinely tip into too much.',
      evidence: 'mixed',
    },
    patience: 'Twelve weeks at least, and pigment sitting deeper in the skin can take much longer or not shift at all.',
    seeSomeone: 'Melasma is genuinely difficult and often hormonal — worth seeing a dermatologist rather than working through it alone. Any single spot that is growing, irregular or new needs looking at properly.',
  },
  {
    key: 'breakouts',
    name: 'Breakouts and congestion',
    alsoCalled: 'acne, blackheads, clogged pores, hormonal spots',
    what: 'A pore blocked with oil and dead cells, usually with inflammation and bacteria involved. Where it appears and when it appears tells you a good deal — along the jaw and around a cycle behaves differently from scattered congestion.',
    actives: ['bha', 'benzoyl-peroxide', 'niacinamide', 'azelaic-acid', 'retinoid'],
    acids: ['salicylic', 'azelaic', 'mandelic'],
    watchFor: 'Doing too much at once. Stripping, scrubbing and layering four actives usually inflames skin that was already inflamed, and the barrier damage outlasts the spots.',
    inside: {
      // sugar_g is an imperfect stand-in: it catches fruit and milk sugar and
      // misses the white bread and rice that actually drive glycaemic load.
      // Said out loud in the UI rather than passed off as the real measure.
      nutrients: ['sugar_g', 'zinc_mg', 'fiber_g'],
      foods: ['oily fish', 'pumpkin seeds', 'chickpeas', 'oats', 'leafy greens'],
      herbs: ['spearmint', 'turmeric'],
      why: 'The clearest dietary link in skin research is between high-glycaemic-load eating and acne — the foods that spike blood sugar fastest, which is white bread, rice and potato more than it is fruit. A weaker and more disputed signal exists for skim milk. Zinc has some supporting evidence. Spearmint tea has small trials behind it, but they measured androgen levels in PCOS rather than acne itself, so the link to spots is an inference rather than a result.',
      evidence: 'mixed',
    },
    patience: 'Six to twelve weeks. Skin often looks worse around weeks two to four on a retinoid before it looks better.',
    seeSomeone: 'Deep, painful lumps that scar are a prescription matter and waiting costs you skin. Sudden adult acne with other changes — hair, cycle, weight — is worth a doctor rather than a stronger cleanser.',
  },
  {
    key: 'redness',
    name: 'Redness and reactivity',
    alsoCalled: 'sensitivity, stinging, flushing, rosacea-prone',
    what: 'Skin whose barrier is letting too much out and too much in. Sometimes it is a damaged barrier that will recover, and sometimes it is a persistent condition — those need opposite amounts of intervention.',
    actives: ['niacinamide', 'ceramides', 'azelaic-acid', 'spf'],
    acids: ['pha'],
    watchFor: 'The urge to treat it. Reactive skin almost always improves with fewer products rather than better ones — and the single most useful move is usually to stop the over-the-counter actives for two weeks. Not anything a doctor prescribed: prescribed creams and tablets are a conversation with whoever prescribed them, never something to quietly drop.',
    inside: {
      nutrients: ['fiber_g', 'vit_e_mg'],
      foods: ['salmon', 'sardines', 'walnuts', 'flaxseed', 'fermented foods'],
      herbs: ['chamomile', 'rooibos', 'turmeric'],
      why: 'Omega-3 fats are genuinely anti-inflammatory, which is well established systemically — the oily fish and seeds above are where they come from, though this app does not count them. Whether that reaches facial redness specifically is far less certain, and common flush triggers — alcohol, heat, spice — are individual enough that noticing yours beats any general list.',
      evidence: 'mixed',
    },
    patience: 'A barrier recovers in two to four weeks of being left alone. If it does not, the cause is something else.',
    seeSomeone: 'Persistent central-face flushing, visible vessels, or bumps that look like acne but do not behave like it may be rosacea, which is treatable and does not respond to acne routines. Gritty or dry eyes alongside it is worth mentioning too. And redness across the cheeks and the bridge of the nose that persists, particularly with joint aches, fatigue or a reaction to sunlight, is worth a doctor rather than a gentler cleanser — a handful of conditions look like sensitive skin and are not, and a year spent treating the wrong one is the common story.',
  },
  {
    key: 'texture',
    name: 'Texture and dullness',
    alsoCalled: 'rough, bumpy, enlarged pores, flat-looking',
    what: 'Dead cells sitting longer than they should, often with dehydration underneath. Pore size itself is mostly inherited — what changes is how visible they are when they are full.',
    actives: ['aha', 'bha', 'retinoid', 'niacinamide'],
    acids: ['lactic', 'glycolic', 'pha'],
    watchFor: 'Over-exfoliating. Shiny, tight, stinging skin is not smooth skin, it is a stripped barrier, and it takes weeks to undo a fortnight of enthusiasm.',
    inside: {
      nutrients: ['water_ml', 'vit_a_mcg'],
      foods: ['sweet potato', 'carrots', 'eggs', 'avocado', 'olive oil', 'water'],
      herbs: ['nettle', 'rooibos'],
      why: 'Vitamin A is central to how skin cells turn over, and topical retinoids are among the best-evidenced things in skincare for exactly that reason — sunscreen being the other. Eating vitamin A supports normal function once you have enough; it does not act like a retinoid, and there is no evidence that more of it changes texture.',
      evidence: 'thin',
    },
    patience: 'Four to six weeks for surface smoothness. Sooner than most things.',
    seeSomeone: 'A rough, scaly, sandpapery patch that persists on skin that has had a lot of sun — face, chest, backs of hands — should be identified by someone before it is exfoliated over. Persistent single rough spots in sun-exposed places are not a texture problem. Anything spreading, itchy or bleeding, likewise.',
  },
  {
    key: 'dryness',
    name: 'Dryness and a tight barrier',
    alsoCalled: 'flaking, tightness, dehydrated, everything stings',
    what: 'Two different things wearing the same name. Dry skin lacks oil and tends to be lifelong; dehydrated skin lacks water and can happen to anybody, including oily skin. The fix is not the same.',
    actives: ['ceramides', 'hyaluronic-acid', 'niacinamide'],
    acids: ['pha', 'lactic'],
    watchFor: 'Hot water, foaming cleansers, and acids. If skin feels squeaky after washing, the cleanser is the problem before anything else is.',
    inside: {
      // Water stays countable because being properly hydrated is a floor worth
      // having — but `why` says plainly that drinking more does not fix a
      // barrier that is leaking, and the two must not drift apart.
      nutrients: ['water_ml', 'vit_e_mg'],
      foods: ['salmon', 'walnuts', 'flaxseed', 'avocado', 'olive oil', 'water'],
      herbs: ['oat-straw', 'rooibos', 'rosehip'],
      why: 'Essential fatty acids are structural components of the skin barrier, so a diet genuinely short of them shows up in skin — the fish, nuts and oils above are the sources, though this app counts water and vitamin E rather than the fats themselves. Beyond correcting a shortfall, more does not mean better, and drinking extra water does not hydrate skin that is losing it through a damaged barrier.',
      evidence: 'mixed',
    },
    patience: 'Two weeks of gentler washing and proper moisturising shows most of what it is going to show.',
    seeSomeone: 'Skin that is cracking, weeping or oozing, or a patch that will not heal, needs to be seen rather than treated at home — weeping is the presentation that most often means infection, and that is a same-week appointment, sometimes sooner. Do not reach for a steroid cream on a weeping area on your own.',
  },
  {
    key: 'everything',
    name: 'All of it, generally',
    alsoCalled: 'I just want good skin',
    what: 'A completely reasonable answer, and often the right one. Most of the benefit in skincare comes from a small number of unglamorous things done consistently rather than from treating a named problem.',
    actives: ['spf', 'retinoid', 'niacinamide', 'ceramides'],
    acids: ['lactic'],
    watchFor: 'Adding. The commonest reason skin stops behaving is a routine that grew, not one that was missing something.',
    inside: {
      nutrients: ['protein_g', 'vit_c_mg', 'zinc_mg', 'water_ml'],
      foods: ['oily fish', 'eggs', 'leafy greens', 'berries', 'nuts', 'olive oil'],
      herbs: ['rooibos', 'rosehip', 'chamomile'],
      why: 'Nothing exotic: enough protein, enough of the antioxidant vitamins, enough of the fats that build the barrier. Enough is the operative word — correcting a shortfall helps, and going past enough has not been shown to do anything. Skin is downstream of sleep, stress, hormones, medication and genetics as much as of food.',
      evidence: 'mixed',
    },
    patience: 'Twelve weeks is the honest unit for judging any routine.',
    seeSomeone: 'Anything painful, spreading, bleeding or changing.',
  },
]

/**
 * Nutrients where the goal is less, not more.
 *
 * Everything else on these lists is something to get enough of. Sugar is the
 * one pointing the other way, and a list that shows it beside protein and
 * vitamin C without saying so reads as "eat more sugar".
 */
export const LESS_IS_THE_GOAL = new Set(['sugar_g', 'sat_fat_g'])

/**
 * Actives that are the same molecule as one of the acids.
 *
 * Azelaic appears in both libraries — as an active and as an acid — so a
 * concern listing both renders it twice. It is filtered from the acid line
 * where the active line already carries it.
 */
export const ACTIVE_ACID_DUPES: Record<string, string> = { 'azelaic-acid': 'azelaic' }

/** Acids to show, minus any already named in the actives row. */
export function acidsToShow(concern: Concern): string[] {
  const covered = new Set(concern.actives.map((a) => ACTIVE_ACID_DUPES[a]).filter(Boolean))
  return concern.acids.filter((a) => !covered.has(a))
}

export function getConcern(key: string | null | undefined): Concern | null {
  if (!key) return null
  return CONCERNS.find((c) => c.key === key) ?? null
}

/**
 * The herbs for a concern, pulled from the apothecary rather than restated.
 *
 * This is the whole point of going through APOTHECARY: those entries already
 * carry their own cautions — pregnancy, blood thinners, thyroid, reflux — and
 * a second list of herb names written here would lose every one of them.
 */
export function herbsFor(concern: Concern): Herb[] {
  return concern.inside.herbs
    .map((key) => APOTHECARY.find((h) => h.key === key))
    .filter((h): h is Herb => Boolean(h))
}

/**
 * Everything to work on, deduplicated, when she has chosen several.
 *
 * Skin does not respect categories and most women have two or three at once.
 * Returned in the order she chose them so the first is treated as the one
 * that matters most.
 */
export function combine(keys: string[]): {
  concerns: Concern[]
  actives: string[]
  acids: string[]
  nutrients: string[]
  herbs: Herb[]
} {
  const concerns = keys.map(getConcern).filter((c): c is Concern => Boolean(c))
  const uniq = (xs: string[]) => [...new Set(xs)]
  return {
    concerns,
    actives: uniq(concerns.flatMap((c) => c.actives)),
    acids: uniq(concerns.flatMap((c) => c.acids)),
    nutrients: uniq(concerns.flatMap((c) => c.inside.nutrients)),
    herbs: uniq(concerns.flatMap((c) => c.inside.herbs))
      .map((key) => APOTHECARY.find((h) => h.key === key))
      .filter((h): h is Herb => Boolean(h)),
  }
}

/**
 * Where two chosen concerns pull in opposite directions.
 *
 * The genuinely useful thing this file can do. A woman who picks breakouts
 * and redness together is being told by one to exfoliate and by the other to
 * stop — and left to work that out alone she will usually do both, badly.
 */
export function tensions(keys: string[]): string[] {
  const has = (k: ConcernKey) => keys.includes(k)
  const out: string[] = []

  if (has('redness') && (has('breakouts') || has('texture'))) {
    out.push(
      'You have chosen reactive skin alongside something that is usually treated by exfoliating. Calm comes first — a barrier that is settled tolerates actives, and one that is not will get worse from them. Give it two quiet weeks before adding anything.',
    )
  }
  if (has('dryness') && has('texture')) {
    out.push(
      'Dryness and texture often turn out to be the same problem: a stripped barrier that flakes and therefore feels rough. Try moisturising properly for two weeks before exfoliating more.',
    )
  }
  if (has('lines') && has('redness')) {
    out.push(
      'Retinoids are the best-evidenced thing for lines and among the most irritating for reactive skin. If you use one, start at once a week on top of moisturiser, and stop if redness gets worse rather than pushing through.',
    )
  }
  if (has('dark-spots') && has('breakouts')) {
    out.push(
      'These usually travel together — most of the marks are the spots healing. Azelaic acid and niacinamide are worth knowing about because they work on both at once, which is one product rather than two.',
    )
  }
  /*
   * Two more pairs where the advice contradicts itself outright.
   *
   * Both were missing, and both are pairs a woman can obviously hold at once —
   * so the accordion showed her one card saying stop the actives and another
   * recommending a retinoid, with nothing between them saying which wins.
   * A contradiction the app does not name is one she has to resolve alone,
   * usually by doing both.
   */
  if (has('redness') && has('dark-spots')) {
    out.push(
      'Fading marks wants actives; calming redness wants a pause from them. The pause comes first — actives on unsettled skin tend to leave more marks than they fade. Azelaic acid is the one worth asking about, because it is the gentlest of the things that work on both.',
    )
  }
  if (has('dryness') && has('breakouts')) {
    out.push(
      'The usual breakout advice — foaming cleansers, salicylic acid, hot water — is the same list dryness needs you to stop. Treat the dryness first and use the acid on the spots themselves rather than the whole face, or you end up with a stripped barrier that breaks out more.',
    )
  }
  return out
}

export const HOLISTIC_NOTE =
  'Skin is fed from the inside, and it is also downstream of sleep, stress, hormones, medication and genetics. Food is one lever among several and rarely the strongest one — worth pulling, not worth blaming yourself over. Nothing here treats or cures anything, and any of it that would mean a real change to how you eat is worth running past a doctor or dietitian first.'

export const PREGNANCY_NOTE =
  'If you are pregnant, trying or feeding, several of the actives above — retinoids especially, and high-strength acids — are usually advised against, and some of the herbs have their own cautions. Vitamin A is worth a separate word: the beta-carotene in vegetables is not the issue, but preformed retinol in liver and in some supplements is, and high intakes are linked to birth defects. This app flags things; it does not clear anything as safe. That conversation belongs with your doctor or midwife.'
