/**
 * Turns a shelf of products into a morning and an evening routine.
 *
 * The ordering rules are not opinion — thinnest to thickest, water before
 * oil, sunscreen last — so the app can simply do it rather than ask.
 * Anything that IS a matter of taste stays the member's to set.
 */

import { findConflicts, findLifeStageCautions, getActive, type Caution, type LifeStage } from '@/lib/actives'

/** Application order within a routine. Lower goes on first. */
const CATEGORY_ORDER: Record<string, number> = {
  cleanser: 10,
  toner: 20,
  essence: 30,
  exfoliant: 35,
  serum: 40,
  treatment: 45,
  eye: 50,
  moisturizer: 60,
  oil: 70,
  spf: 90,
  // hair and nails have their own small sequences
  shampoo: 10,
  conditioner: 20,
  'hair-mask': 25,
  'hair-treatment': 40,
  'hair-oil': 70,
  'nail-base': 10,
  'nail-treatment': 40,
  'nail-oil': 70,
}

export interface ShelfItem {
  id: string
  name: string
  category: string | null
  actives: string[]
  timeOfDay: string | null
  frequencyPerWeek: number | null
}

export interface RoutineStep {
  id: string
  name: string
  category: string | null
  actives: string[]
  /** Set when this one should not run every day. */
  cadence?: string
}

export interface Routine {
  slot: 'am' | 'pm'
  steps: RoutineStep[]
  cautions: Caution[]
}

function orderOf(category: string | null): number {
  if (!category) return 55 // unknown lands mid-routine, before moisturiser
  return CATEGORY_ORDER[category] ?? 55
}

/**
 * Where a product belongs when the member has not said.
 *
 * A product inherits the strictest requirement of its actives: anything with
 * a retinoid is an evening product even if its other ingredients are neutral.
 */
function slotFor(item: ShelfItem): 'am' | 'pm' | 'both' {
  if (item.timeOfDay === 'am' || item.timeOfDay === 'pm' || item.timeOfDay === 'both') {
    return item.timeOfDay
  }
  if (item.category === 'spf') return 'am'
  const times = item.actives.map((k) => getActive(k)?.timeOfDay).filter(Boolean)
  if (times.includes('pm')) return 'pm'
  if (times.includes('am')) return 'am'
  return 'both'
}

/**
 * Actives that clash get spread across the week instead of stacked.
 * Retinoid takes the majority of nights; acids get their own.
 */
function cadenceFor(item: ShelfItem, conflicted: Set<string>): string | undefined {
  if (item.frequencyPerWeek) return `${item.frequencyPerWeek}× a week`
  const clashing = item.actives.filter((a) => conflicted.has(a))
  if (clashing.length === 0) return undefined
  if (item.actives.includes('retinoid')) return 'Mon, Wed, Fri nights'
  if (item.actives.includes('aha') || item.actives.includes('bha')) return 'Sunday night, on its own'
  return 'alternate nights'
}

export function buildRoutines(shelf: ShelfItem[], lifeStage: LifeStage): { am: Routine; pm: Routine } {
  const inSlot = (slot: 'am' | 'pm') =>
    shelf.filter((i) => {
      const s = slotFor(i)
      return s === slot || s === 'both'
    })

  function assemble(slot: 'am' | 'pm'): Routine {
    const items = inSlot(slot)
    const actives = [...new Set(items.flatMap((i) => i.actives))]

    const conflicts = findConflicts(actives)
    const conflicted = new Set(conflicts.flatMap((c) => c.actives))

    const steps = items
      .slice()
      .sort((a, b) => orderOf(a.category) - orderOf(b.category))
      .map((i) => ({
        id: i.id,
        name: i.name,
        category: i.category,
        actives: i.actives,
        cadence: slot === 'pm' ? cadenceFor(i, conflicted) : undefined,
      }))

    // Conflicts matter in both slots. Vitamin C and benzoyl peroxide clash in
    // the morning, and saying nothing there was a real gap.
    const cautions = [...conflicts, ...findLifeStageCautions(actives, lifeStage)]

    return { slot, steps, cautions }
  }

  return { am: assemble('am'), pm: assemble('pm') }
}

/** What is missing from a routine that probably should not be. */
export function findGaps(shelf: ShelfItem[]): string[] {
  const categories = new Set(shelf.map((i) => i.category).filter(Boolean) as string[])
  const gaps: string[] = []
  if (!categories.has('spf')) gaps.push('No sunscreen yet — it is the one step that protects everything else you are doing.')
  if (!categories.has('cleanser')) gaps.push('No cleanser on your shelf.')
  if (!categories.has('moisturizer')) gaps.push('No moisturiser on your shelf.')
  return gaps
}
