import { COURSE } from '@/lib/courses'
import { youTubeId, youTubeThumb } from '@/lib/youtube'
import { COLLECTIONS, COLLECTION_LABEL } from '@/lib/types'
import type { Collection, Pillar, Recipe, Resource, Workout } from '@/lib/types'

export type VaultKind = 'resource' | 'recipe' | 'workout' | 'day'

export interface VaultItem {
  id: string
  kind: VaultKind
  title: string
  description: string
  pillar: Pillar | null
  /** Library shelf outside the four pillars (worship, sleep). */
  collection: Collection | null
  href: string
  /** Set when it can play in the app instead of opening another tab. */
  videoId: string | null
  image: string | null
  meta: string
  saved: boolean
  createdAt: string
  /** Lowercased haystack, built once on the server so search stays cheap. */
  search: string
}

function clean(s: string | null | undefined): string {
  return (s ?? '').replace(/\s+/g, ' ').trim()
}

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
    const vid = youTubeId(r.url)
    items.push({
      id: r.id,
      kind: 'resource',
      title: r.title,
      description: clean(r.description),
      pillar: r.pillar,
      collection: r.collection ?? null,
      href: r.url ?? '/app/vault',
      videoId: vid,
      image: r.image_url ?? (vid ? youTubeThumb(vid) : null),
      meta: r.pillar ?? r.resource_type,
      saved: Boolean(r.saved),
      createdAt: r.created_at,
      search: `${r.title} ${clean(r.description)} ${r.resource_type} ${r.pillar ?? ''} ${r.collection ?? ''}`.toLowerCase(),
    })
  }

  for (const r of recipes) {
    const vid = youTubeId(r.video_url)
    items.push({
      id: r.id,
      kind: 'recipe',
      title: r.title,
      description: clean(r.description),
      pillar: r.pillar,
      collection: null,
      href: `/app/recipes#r-${r.id}`,
      videoId: vid,
      image: r.image_url ?? (vid ? youTubeThumb(vid) : null),
      meta: [r.meal_type !== 'any' ? r.meal_type : null, r.prep_minutes ? `${r.prep_minutes} min` : null].filter(Boolean).join(' · ') || 'recipe',
      saved: Boolean(r.saved),
      createdAt: r.created_at,
      search: `${r.title} ${clean(r.description)} ${clean(r.ingredients)} ${r.meal_type} ${r.season} ${r.pillar ?? ''}`.toLowerCase(),
    })
  }

  for (const w of workouts) {
    const vid = youTubeId(w.video_url)
    items.push({
      id: w.id,
      kind: 'workout',
      title: w.title,
      description: clean(w.description),
      pillar: w.pillar,
      collection: null,
      href: `/app/workouts#w-${w.id}`,
      videoId: vid,
      image: w.image_url ?? (vid ? youTubeThumb(vid) : null),
      meta: [w.workout_type, w.body_group].filter((x) => x && x !== 'any').join(' · ') || 'workout',
      saved: false,
      createdAt: w.created_at,
      search: `${w.title} ${clean(w.description)} ${w.workout_type} ${w.body_group} ${w.pillar}`.toLowerCase(),
    })
  }

  for (const d of COURSE.days) {
    const text = d.blocks.map((b) => ('v' in b ? b.v : 'prompt' in b ? b.prompt : 'q' in b ? b.q : 'text' in b ? b.text : '')).join(' ')
    items.push({
      id: `day-${d.day_number}`,
      kind: 'day',
      title: `Day ${d.day_number} · ${d.title}`,
      description: clean(text).slice(0, 160),
      pillar: null,
      collection: null,
      href: `/app/program/day/${d.day_number}`,
      videoId: null,
      image: null,
      meta: `week ${d.week_number} · ${d.kind}`,
      saved: false,
      createdAt: '',
      search: `${d.title} ${clean(text)} week ${d.week_number} day ${d.day_number} ${d.kind}`.toLowerCase(),
    })
  }

  return items
}

const PILLAR_SHELF: { pillar: Pillar; title: string }[] = [
  { pillar: 'Body', title: 'Body' },
  { pillar: 'Identity', title: 'Identity' },
  { pillar: 'Mindset', title: 'Mindset' },
  { pillar: 'Faith', title: 'Faith' },
]

/** Rows to scroll through, in the order they should appear. Empty rows drop out. */
export function buildShelves(items: VaultItem[]): { title: string; items: VaultItem[] }[] {
  const byNewest = (a: VaultItem, b: VaultItem) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
  const videos = items.filter((i) => i.videoId).sort(byNewest)
  const saved = items.filter((i) => i.saved)

  const shelves = [
    { title: 'Watch', items: videos },
    { title: 'Saved', items: saved },
    ...PILLAR_SHELF.map((p) => ({ title: p.title, items: items.filter((i) => i.pillar === p.pillar).sort(byNewest) })),
    ...COLLECTIONS.map((c) => ({ title: COLLECTION_LABEL[c], items: items.filter((i) => i.collection === c).sort(byNewest) })),
    { title: 'Cook', items: items.filter((i) => i.kind === 'recipe').sort(byNewest) },
    { title: 'Move', items: items.filter((i) => i.kind === 'workout').sort(byNewest) },
    { title: 'Course days', items: items.filter((i) => i.kind === 'day') },
  ]
  return shelves.filter((s) => s.items.length > 0)
}
