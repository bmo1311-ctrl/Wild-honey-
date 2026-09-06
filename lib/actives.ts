/**
 * What is actually in a product, and what that means for a routine.
 *
 * This lives in code rather than the database on purpose: it is reference
 * knowledge, it changes rarely, and when it does change it should go through
 * review like any other edit. The product library grows from what members
 * scan; this dictionary does not.
 *
 * A word on what this is and is not. It organises a routine and raises a
 * hand. It does not clear anyone medically. Every caution below is the
 * common, widely published guidance — it is a prompt to ask a doctor,
 * midwife or dermatologist, never a substitute for asking one.
 */

export type Domain = 'skin' | 'hair' | 'nails' | 'body'
export type TimeOfDay = 'am' | 'pm' | 'any'

export interface Active {
  key: string
  label: string
  /** Lowercased INCI names and common spellings, matched against a label. */
  aliases: string[]
  /** When it belongs in a routine, where that is not a matter of taste. */
  timeOfDay: TimeOfDay
  /** Other active keys that should not be used in the same routine slot. */
  conflictsWith: string[]
  /** Commonly avoided in pregnancy or while breastfeeding. */
  pregnancyCaution: boolean
  /** Plain-language reason about timing or layering, shown in the routine. */
  note?: string
  /** Why it is cautioned in pregnancy. Kept separate — a timing note is not a safety note. */
  pregnancyNote?: string
}

export const ACTIVES: Active[] = [
  {
    key: 'retinoid',
    label: 'Retinoid',
    aliases: [
      'retinol', 'retinal', 'retinaldehyde', 'tretinoin', 'adapalene', 'retinyl palmitate',
      'retinyl retinoate', 'hydroxypinacolone retinoate', 'granactive retinoid',
    ],
    timeOfDay: 'pm',
    conflictsWith: ['aha', 'bha', 'benzoyl-peroxide'],
    pregnancyCaution: true,
    note: 'Evening only, and not on the same night as acids or benzoyl peroxide — together they tend to irritate rather than work harder.',
    pregnancyNote: 'Vitamin A derivatives are the ingredient class most consistently advised against.',
  },
  {
    key: 'aha',
    label: 'AHA (glycolic, lactic, mandelic)',
    aliases: ['glycolic acid', 'lactic acid', 'mandelic acid', 'citric acid', 'malic acid', 'tartaric acid'],
    timeOfDay: 'pm',
    conflictsWith: ['retinoid', 'bha'],
    pregnancyCaution: false,
    note: 'Its own night. Wear sunscreen the next morning — skin is more sun-sensitive after an acid.',
  },
  {
    key: 'bha',
    label: 'BHA (salicylic acid)',
    aliases: ['salicylic acid', 'betaine salicylate', 'willow bark extract', 'salix alba'],
    timeOfDay: 'any',
    conflictsWith: ['retinoid', 'aha'],
    pregnancyCaution: true,
    note: 'Fine morning or evening, but not on the same night as a retinoid or an AHA.',
    pregnancyNote: 'Low strengths on the face are usually considered fine; higher strengths and full-body use are the ones to ask about.',
  },
  {
    key: 'vitamin-c',
    label: 'Vitamin C',
    aliases: [
      'ascorbic acid', 'l-ascorbic acid', 'sodium ascorbyl phosphate',
      'magnesium ascorbyl phosphate', 'ascorbyl glucoside', 'tetrahexyldecyl ascorbate', 'ethyl ascorbic acid',
    ],
    timeOfDay: 'am',
    conflictsWith: ['benzoyl-peroxide'],
    pregnancyCaution: false,
    note: 'Mornings, under sunscreen — that is where it does the most good.',
  },
  {
    key: 'benzoyl-peroxide',
    label: 'Benzoyl peroxide',
    aliases: ['benzoyl peroxide'],
    timeOfDay: 'any',
    conflictsWith: ['retinoid', 'vitamin-c', 'hydroquinone'],
    pregnancyCaution: false,
    note: 'Keep it away from retinoids and vitamin C — it breaks both down.',
  },
  {
    key: 'niacinamide',
    label: 'Niacinamide',
    aliases: ['niacinamide', 'nicotinamide'],
    timeOfDay: 'any',
    conflictsWith: [],
    pregnancyCaution: false,
    note: 'Gets on with almost everything. Safe to keep in both routines.',
  },
  {
    key: 'azelaic-acid',
    label: 'Azelaic acid',
    aliases: ['azelaic acid'],
    timeOfDay: 'any',
    conflictsWith: [],
    pregnancyCaution: false,
    note: 'One of the few actives usually kept during pregnancy — still worth confirming with your provider.',
  },
  {
    key: 'hydroquinone',
    label: 'Hydroquinone',
    aliases: ['hydroquinone'],
    timeOfDay: 'pm',
    conflictsWith: ['benzoyl-peroxide'],
    pregnancyCaution: true,
    note: 'Evening only.',
    pregnancyNote: 'Commonly stopped because far more of it is absorbed through the skin than most actives.',
  },
  {
    key: 'peptides',
    label: 'Peptides',
    aliases: ['palmitoyl', 'matrixyl', 'copper tripeptide', 'acetyl hexapeptide', 'peptide'],
    timeOfDay: 'any',
    conflictsWith: [],
    pregnancyCaution: false,
  },
  {
    key: 'hyaluronic-acid',
    label: 'Hyaluronic acid',
    aliases: ['hyaluronic acid', 'sodium hyaluronate', 'hydrolyzed hyaluronic acid'],
    timeOfDay: 'any',
    conflictsWith: [],
    pregnancyCaution: false,
  },
  {
    key: 'ceramides',
    label: 'Ceramides',
    aliases: ['ceramide', 'ceramide np', 'ceramide ap', 'ceramide eop'],
    timeOfDay: 'any',
    conflictsWith: [],
    pregnancyCaution: false,
  },
  {
    key: 'spf',
    label: 'Sunscreen',
    aliases: [
      'zinc oxide', 'titanium dioxide', 'avobenzone', 'octinoxate',
      'octocrylene', 'homosalate', 'tinosorb', 'uvinul',
    ],
    timeOfDay: 'am',
    conflictsWith: [],
    pregnancyCaution: false,
    note: 'Last step every morning, over everything else.',
  },
]

const BY_KEY = new Map(ACTIVES.map((a) => [a.key, a]))

export function getActive(key: string): Active | undefined {
  return BY_KEY.get(key)
}

/**
 * Read actives off an ingredient list.
 *
 * Deliberately conservative: it only claims what it can see spelled out, so a
 * miss shows up as a gap the member can fill rather than a wrong answer she
 * would have to notice.
 */
export function detectActives(ingredientsRaw: string): string[] {
  const hay = ingredientsRaw.toLowerCase()
  const found = new Set<string>()
  for (const active of ACTIVES) {
    if (active.aliases.some((alias) => hay.includes(alias))) found.add(active.key)
  }
  return [...found]
}

export interface Caution {
  level: 'conflict' | 'pregnancy'
  actives: string[]
  message: string
}

/** Two actives that should not share a slot. */
export function findConflicts(activeKeys: string[]): Caution[] {
  const out: Caution[] = []
  const seen = new Set<string>()
  for (const key of activeKeys) {
    const active = getActive(key)
    if (!active) continue
    for (const other of active.conflictsWith) {
      if (!activeKeys.includes(other)) continue
      const pair = [key, other].sort().join('+')
      if (seen.has(pair)) continue
      seen.add(pair)
      out.push({
        level: 'conflict',
        actives: [key, other],
        message: `${active.label} and ${getActive(other)?.label ?? other} are better on different nights than layered together.`,
      })
    }
  }
  return out
}

export type LifeStage = 'pregnant' | 'trying' | 'breastfeeding' | 'none' | null | undefined

/**
 * Cautions raised by life stage.
 *
 * Phrased as "commonly avoided — ask your provider", never as a verdict.
 * Getting this wrong in the confident direction is the one failure here that
 * could actually harm someone.
 */
export function findLifeStageCautions(activeKeys: string[], stage: LifeStage): Caution[] {
  if (!stage || stage === 'none') return []
  const when =
    stage === 'pregnant' ? 'in pregnancy' : stage === 'breastfeeding' ? 'while breastfeeding' : 'when trying to conceive'

  return activeKeys
    .map(getActive)
    .filter((a): a is Active => Boolean(a?.pregnancyCaution))
    .map((a) => ({
      level: 'pregnancy' as const,
      actives: [a.key],
      message: `${a.label} is commonly avoided ${when}.${a.pregnancyNote ? ` ${a.pregnancyNote}` : ''} Worth confirming with your doctor or midwife before you keep using it.`,
    }))
}

/**
 * Guess what kind of product it is from its name.
 *
 * Saves her a dropdown she would otherwise have to think about, and she can
 * always change it. Wrong guesses are cheap; a required field is not.
 */
const CATEGORY_HINTS: [RegExp, string][] = [
  // Order matters: what a product DOES beats what it is suspended in.
  // "Retinol 0.5% in Squalane" is a treatment, not an oil.
  [/\b(spf|sunscreen|sun cream|uv filter)\b/i, 'spf'],
  [/\b(cleanser|cleansing|face wash|foaming|micellar)\b/i, 'cleanser'],
  [/\b(retinol|retinal|retinoid|tretinoin|adapalene|benzoyl|spot treatment|acne)\b/i, 'treatment'],
  [/\b(exfoliant|peel|scrub|resurfac|aha|bha)\b/i, 'exfoliant'],
  [/\b(glycolic|lactic|salicylic|mandelic)\b.*\b(toner|toning|solution|essence)\b/i, 'toner'],
  [/\b(glycolic|lactic|salicylic|mandelic)\b/i, 'exfoliant'],
  [/\beye\b/i, 'eye'],
  [/\b(toner|toning|tonic)\b/i, 'toner'],
  [/\bessence\b/i, 'essence'],
  [/\b(serum|ampoule|booster|concentrate)\b/i, 'serum'],
  [/\b(oil|squalane|rosehip|jojoba)\b/i, 'oil'],
  [/\b(cream|lotion|moistur|balm|hydrat|emulsion)\b/i, 'moisturizer'],
]

export function guessCategory(name: string): string | null {
  for (const [pattern, category] of CATEGORY_HINTS) {
    if (pattern.test(name)) return category
  }
  return null
}
