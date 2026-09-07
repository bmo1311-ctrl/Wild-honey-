/**
 * The areas Protocols is divided into.
 *
 * One place that knows what each area is called, what belongs in it, what
 * order things go on, and what it means for that area to be missing
 * something. Adding an area later means adding a row here, not touching
 * the page.
 */

import type { BeautyDomain } from '@/lib/types'

export type ProtocolArea = BeautyDomain | 'resets'

export interface AreaGap {
  /** The category whose absence is worth mentioning. */
  category: string
  /** Said in this area's own language. */
  note: string
}

export interface AreaMeta {
  key: ProtocolArea
  label: string
  /** Shown under the heading once she is inside. */
  blurb: string
  /** Shown on the chooser, before she has picked anything. */
  invite: string
  /** Product kinds that make sense here, in the order they are applied. */
  categories: string[]
  /**
   * Whether this area splits into morning and evening.
   *
   * Skin does. Hair does not — it runs on wash days, and showing a woman a
   * morning and an evening column for her shampoo invents a routine she was
   * never meant to have. Nails are the same.
   */
  dayParts: boolean
  /**
   * What is worth noticing as missing, in this area's own terms.
   *
   * This used to be one hardcoded skin list applied to every area, so Hair
   * announced that she had no sunscreen and no moisturiser — true, and
   * completely beside the point.
   */
  gaps: AreaGap[]
}

export const AREAS: AreaMeta[] = [
  {
    key: 'skin',
    label: 'Skin',
    blurb: 'morning and evening, in order.',
    invite: 'morning and evening, in order.',
    categories: ['cleanser', 'toner', 'essence', 'exfoliant', 'serum', 'treatment', 'eye', 'moisturizer', 'oil', 'spf'],
    dayParts: true,
    gaps: [
      { category: 'spf', note: 'No sunscreen yet — it is the one step that protects everything else you are doing.' },
      { category: 'cleanser', note: 'No cleanser on your shelf.' },
      { category: 'moisturizer', note: 'No moisturiser on your shelf.' },
    ],
  },
  {
    key: 'hair',
    label: 'Hair',
    blurb: 'wash days and treatments.',
    invite: 'wash days, masks, and what goes on damp.',
    categories: ['shampoo', 'conditioner', 'hair-mask', 'hair-treatment', 'hair-oil'],
    dayParts: false,
    gaps: [
      { category: 'shampoo', note: 'No shampoo yet — the wash plan needs one to build around.' },
      { category: 'conditioner', note: 'No conditioner on your shelf.' },
    ],
  },
  {
    key: 'nails',
    label: 'Nails',
    blurb: 'oil, base, and the fortnight you forget.',
    invite: 'oil, base, and the fortnight you forget.',
    categories: ['nail-base', 'nail-treatment', 'nail-oil'],
    dayParts: false,
    gaps: [{ category: 'nail-oil', note: 'No cuticle oil yet — it is the one that actually changes things.' }],
  },
  {
    key: 'body',
    label: 'Body',
    blurb: 'everything below the jaw.',
    invite: 'everything below the jaw.',
    categories: ['cleanser', 'exfoliant', 'treatment', 'moisturizer', 'oil', 'spf'],
    dayParts: true,
    gaps: [{ category: 'moisturizer', note: 'No body moisturiser on your shelf.' }],
  },
  {
    key: 'resets',
    label: 'Resets',
    blurb: 'five days, then done.',
    invite: 'five days, then done. for a week gone sideways.',
    categories: [],
    dayParts: false,
    gaps: [],
  },
]

export function getArea(key: string | undefined): AreaMeta | undefined {
  return AREAS.find((a) => a.key === key)
}

/** The beauty areas only — Resets is a different kind of thing. */
export const BEAUTY_AREAS = AREAS.filter((a) => a.key !== 'resets')
