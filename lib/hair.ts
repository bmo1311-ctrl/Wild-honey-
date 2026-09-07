/**
 * What each hair product is actually for.
 *
 * Skin sorts by what a product is suspended in — a serum, a cream. Hair does
 * not work that way. Two identical-looking "masks" can do opposite things:
 * one floods the strand with moisture, the other packs it with protein, and
 * doing the second one twice in a row is how hair starts snapping off.
 *
 * So hair is sorted by role, and role is what the schedule runs on.
 */

export type HairRole =
  | 'cleanse'
  | 'clarify'
  | 'condition'
  | 'moisture'
  | 'protein'
  | 'bond'
  | 'scalp'
  | 'oil'

export interface HairRoleMeta {
  key: HairRole
  label: string
  /** Why it is spaced the way it is, in plain language. */
  note: string
  /**
   * Fewest washes between uses. Counted in washes rather than days, because
   * hair does not care what the date is — it cares how many times it has been
   * stripped and rebuilt since.
   */
  minWashGap?: number
}

export const HAIR_ROLES: Record<HairRole, HairRoleMeta> = {
  cleanse: {
    key: 'cleanse',
    label: 'wash',
    note: 'every wash day.',
  },
  clarify: {
    key: 'clarify',
    label: 'clarify',
    note: 'strips buildup, and strips your good oils with it. once a month is plenty.',
    minWashGap: 4,
  },
  condition: {
    key: 'condition',
    label: 'condition',
    note: 'every wash, after shampoo.',
  },
  moisture: {
    key: 'moisture',
    label: 'moisture mask',
    note: 'the softness half. this is what makes hair bend instead of break.',
  },
  protein: {
    key: 'protein',
    label: 'protein',
    note: 'the strength half. too often and hair goes stiff, then brittle, then short.',
    minWashGap: 3,
  },
  bond: {
    key: 'bond',
    label: 'bond builder',
    note: 'repairs the internal bonds. does not replace moisture, and does not stack with protein.',
    minWashGap: 2,
  },
  scalp: {
    key: 'scalp',
    label: 'scalp',
    note: 'exfoliates the scalp. not every wash — it is skin down there.',
    minWashGap: 2,
  },
  oil: {
    key: 'oil',
    label: 'oil',
    note: 'for the days between, on lengths and ends.',
  },
}

/** Roles that change the strand's structure. Only one of these per wash. */
export const STRUCTURAL: HairRole[] = ['protein', 'bond']

/**
 * Work out what a product does from its name, falling back to its category.
 *
 * Ordered so that what a product DOES beats what it is called — a "mask" that
 * says protein is a protein treatment first and a mask second.
 */
export function detectHairRole(name: string, category: string | null): HairRole {
  const n = name.toLowerCase()

  // Bond builders name themselves, and the two big ones are known by number.
  if (/olaplex|\bk18\b|bond|plex\b/.test(n)) return 'bond'

  // Protein announces itself; so do the proteins themselves.
  if (/protein|keratin|collagen|amino acid|rice water/.test(n)) return 'protein'

  // An oil stays an oil even when "scalp" is printed on the bottle — the
  // rosemary oils all say it, and they belong on the days between washes.
  if (category === 'hair-oil') return 'oil'

  // Scalp work proper: acids and anti-dandruff actives that treat the skin.
  if (/dandruff|ketoconazole|salicylic|exfoliat|scalp scrub|scalp treatment/.test(n)) return 'scalp'

  if (/clarif|detox|anti-residue|chelat|purify/.test(n)) return 'clarify'

  if (category === 'hair-oil' || /\boil\b|serum/.test(n)) return 'oil'
  if (category === 'shampoo') return 'cleanse'
  if (category === 'conditioner') return 'condition'
  if (category === 'hair-mask') return 'moisture'
  if (category === 'hair-treatment') return 'moisture'

  return 'condition'
}

export function getHairRole(key: string): HairRoleMeta | undefined {
  return HAIR_ROLES[key as HairRole]
}
