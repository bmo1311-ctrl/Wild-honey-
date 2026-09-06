/**
 * The areas Protocols is divided into.
 *
 * One place that knows what each area is called, what belongs in it, and what
 * order things go on. Adding Body later means adding a row here, not touching
 * the page.
 */

import type { BeautyDomain } from '@/lib/types'

export type ProtocolArea = BeautyDomain | 'resets'

export interface AreaMeta {
  key: ProtocolArea
  label: string
  /** Shown under the heading once she is inside. */
  blurb: string
  /** Shown on the chooser, before she has picked anything. */
  invite: string
  /** Product kinds that make sense here, in the order they are applied. */
  categories: string[]
}

export const AREAS: AreaMeta[] = [
  {
    key: 'skin',
    label: 'Skin',
    blurb: 'morning and evening, in order.',
    invite: 'morning and evening, in order.',
    categories: ['cleanser', 'toner', 'essence', 'exfoliant', 'serum', 'treatment', 'eye', 'moisturizer', 'oil', 'spf'],
  },
  {
    key: 'hair',
    label: 'Hair',
    blurb: 'wash days and treatments.',
    invite: 'wash days, masks, and what goes on damp.',
    categories: ['shampoo', 'conditioner', 'hair-mask', 'hair-treatment', 'hair-oil'],
  },
  {
    key: 'nails',
    label: 'Nails',
    blurb: 'oil, base, and the fortnight you forget.',
    invite: 'oil, base, and the fortnight you forget.',
    categories: ['nail-base', 'nail-treatment', 'nail-oil'],
  },
  {
    key: 'body',
    label: 'Body',
    blurb: 'everything below the jaw.',
    invite: 'everything below the jaw.',
    categories: ['cleanser', 'exfoliant', 'treatment', 'moisturizer', 'oil', 'spf'],
  },
  {
    key: 'resets',
    label: 'Resets',
    blurb: 'five days, then done.',
    invite: 'five days, then done. for a week gone sideways.',
    categories: [],
  },
]

export function getArea(key: string | undefined): AreaMeta | undefined {
  return AREAS.find((a) => a.key === key)
}

/** The beauty areas only — Resets is a different kind of thing. */
export const BEAUTY_AREAS = AREAS.filter((a) => a.key !== 'resets')
