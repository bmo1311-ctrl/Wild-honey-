import { COURSE } from '@/lib/courses'
import type { Pillar, Recipe, Resource, Workout } from '@/lib/types'

export type VaultKind = 'resource' | 'recipe' | 'workout' | 'day'

export interface VaultItem {
  id: string
  kind: VaultKind
  title: string
  description: string
  pillar: Pillar | null
  href: string
  external: boolean
  meta: string
  saved: boolean
  /** Lowercased haystack, built once on the server so search stays cheap. */
  search: string
}

const PILLAR_BY_KIND: Record<string, Pillar> = { Body: 'Body', Identity: 'Identity', Mindset: 'Mindset', Faith: 'Faith' }

function clean(s: string | null | undefined): string {
  return (s ?? '').replace(/\s+/g, ' ').trim()
}

/**
 * One index across everything a member can read, cook, move to, or revisit.
 * 200-odd items, so it is sent whole and filtered in the browser — no
 * round trip per keystroke.
 */
export function buildVaultIndex({
  resources,
  recipes,
  workouts,
}: {
  resources: Resource[]
  recipes: Recipe[]
  workouts: Workout[]
}): VaultItem[] {
  const items: VaultItem[] = []

  for (const r of resources) {
    items.push({
      id: r.id,
      kind: 'resource',
      title: r.title,
      description: clean(r.description),
      pillar: r.pillar,
      href: r.url ?? '/app/vault',
      external: Boolean(r.url),
      meta: r.resource_type,
      saved: Boolean(r.saved),
      search: `${r.title} ${clean(r.description)} ${r.resource_type} ${r.pillar ?? ''}`.toLowerCase(),
    })
  }

  for (const r of recipes) {
    const meta = [r.meal_type !== 'any' ? r.meal_type : null, r.prep_minutes ? `${r.prep_minutes} min` : null]
      .filter(Boolean)
      .join(' · ')
    items.push({
      id: r.id,
      kind: 'recipe',
      title: r.title,
      description: clean(r.description),
      pillar: r.pillar,
      href: `/app/recipes#r-${r.id}`,
      external: false,
      meta: meta || 'recipe',
      saved: Boolean(r.saved),
      search: `${r.title} ${clean(r.description)} ${clean(r.ingredients)} ${r.meal_type} ${r.season} ${r.pillar ?? ''}`.toLowerCase(),
    })
  }

  for (const w of workouts) {
    items.push({
      id: w.id,
      kind: 'workout',
      title: w.title,
      description: clean(w.description),
      pillar: w.pillar,
      href: `/app/workouts#w-${w.id}`,
      external: false,
      meta: [w.workout_type, w.body_group].filter((x) => x && x !== 'any').join(' · ') || 'workout',
      saved: false,
      search: `${w.title} ${clean(w.description)} ${w.workout_type} ${w.body_group} ${w.pillar}`.toLowerCase(),
    })
  }

  for (const d of COURSE.days) {
    const text = d.blocks
      .map((b) => ('v' in b ? b.v : 'prompt' in b ? b.prompt : 'q' in b ? b.q : 'text' in b ? b.text : ''))
      .join(' ')
    items.push({
      id: `day-${d.day_number}`,
      kind: 'day',
      title: `Day ${d.day_number} · ${d.title}`,
      description: clean(text).slice(0, 160),
      pillar: PILLAR_BY_KIND.Body,
      href: `/app/program/day/${d.day_number}`,
      external: false,
      meta: `week ${d.week_number} · ${d.kind}`,
      saved: false,
      search: `${d.title} ${clean(text)} week ${d.week_number} day ${d.day_number} ${d.kind}`.toLowerCase(),
    })
  }

  return items
}

export const VAULT_TABS: { key: VaultKind | 'all' | 'saved'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'resource', label: 'Read' },
  { key: 'recipe', label: 'Cook' },
  { key: 'workout', label: 'Move' },
  { key: 'day', label: 'Course' },
  { key: 'saved', label: 'Saved' },
]
