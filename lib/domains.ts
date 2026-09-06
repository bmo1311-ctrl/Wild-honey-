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
    blurb: 'your products, in the order they actually go on.',
    invite: 'morning and evening, sorted for you — and the nights between kept gentle.',
    categories: ['cleanser', 'toner', 'essence', 'exfoliant', 'serum', 'treatment', 'eye', 'moisturizer', 'oil', 'spf'],
  },
  {
    key: 'hair',
    label: 'Hair',
    blurb: 'wash days, treatments, and what goes on damp.',
    invite: 'stop guessing which week the protein mask was.',
    categories: ['shampoo', 'conditioner', 'hair-mask', 'hair-treatment', 'hair-oil'],
  },
  {
    key: 'nails',
    label: 'Nails',
    blurb: 'the small maintenance that only works when it is regular.',
    invite: 'oil, base, and the fortnight you always forget.',
    categories: ['nail-base', 'nail-treatment', 'nail-oil'],
  },
  {
    key: 'body',
    label: 'Body',
    blurb: 'everything below the jaw.',
    invite: 'body acids, oils, and the bits that get forgotten.',
    categories: ['cleanser', 'exfoliant', 'treatment', 'moisturizer', 'oil', 'spf'],
  },
  {
    key: 'resets',
    label: 'Resets',
    blurb: 'a few days of small changes, for when something needs turning around.',
    invite: 'five days, then done. for a week that has gone sideways.',
    categories: [],
  },
]

export function getArea(key: string | undefined): AreaMeta | undefined {
  return AREAS.find((a) => a.key === key)
}

/** The beauty areas only — Resets is a different kind of thing. */
export const BEAUTY_AREAS = AREAS.filter((a) => a.key !== 'resets')
