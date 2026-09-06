/**
 * Membership tiers and what they open.
 *
 * Free is the hook: Today, logging, Body, check-ins, habits, and reading the
 * Circle. The Circle is the whole lifestyle system. Inner Circle adds the
 * experts and live access. Founder is her. The database applies the same
 * rule in `is_paid()`, and a child always inherits her guardian's tier.
 */
export type Tier = 'free' | 'circle' | 'inner-circle' | 'founder'
export type Requirement = 'circle' | 'inner-circle'

export const TIER_RANK: Record<Tier, number> = { free: 0, circle: 1, 'inner-circle': 2, founder: 3 }
export const TIER_NAME: Record<Requirement, string> = { circle: 'The Circle', 'inner-circle': 'Inner Circle' }

export function asTier(t: string | null | undefined): Tier {
  return t && t in TIER_RANK ? (t as Tier) : 'free'
}

/** True when a tier is enough for an area. No requirement means free. */
export function meets(tier: Tier, required?: Requirement | null): boolean {
  return !required || TIER_RANK[tier] >= TIER_RANK[required]
}

export interface Access {
  tier: Tier
  paid: boolean
  inner: boolean
}

export function accessFor(tier: Tier): Access {
  return { tier, paid: meets(tier, 'circle'), inner: meets(tier, 'inner-circle') }
}
