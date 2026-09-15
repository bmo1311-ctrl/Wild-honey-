import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { PILLARS } from '@/lib/pillars'
import type { Pillar } from '@/lib/types'
import { buildShelf, type Offering, type Shelf } from '@/lib/shelf'
import type { CapacityLevel } from '@/lib/personal-state'
import { localToday } from '@/lib/today'

/**
 * Where the inspiration already lives.
 *
 * Nothing new had to be written for this. There are 105 prompts, every one of
 * them tagged with a pillar, and 58 tagged resources — all of it hers, all of
 * it already in the database. It was simply only reachable through the
 * features that happened to own the tables: a prompt appeared if it was
 * scheduled for today and was otherwise invisible, and a resource appeared if
 * she went to the vault and scrolled.
 *
 * So the pillars did not need a new content model. They needed an index. This
 * is that index: everything she has written, gathered by pillar instead of by
 * whichever feature stores it.
 *
 * Two queries, both small, both cached per request.
 */

/**
 * Premium prompts are not filtered out here.
 *
 * `is_premium` gates the *scheduled daily prompt*, which is a different
 * surface with its own paywall. Everything on this shelf sits behind
 * `/app/becoming`, which is already gated, so filtering again would only
 * mean a paying member sees less of what she pays for.
 */
export const getShelves = cache(async function getShelves(
  capacity: CapacityLevel,
): Promise<Shelf[]> {
  const supabase = await createClient()
  const [today, { data: prompts }, { data: resources }] = await Promise.all([
    localToday(),
    supabase.from('prompts').select('id, pillar, text'),
    supabase.from('resources').select('id, title, description, url, pillar, resource_type'),
  ])

  const byPillar = new Map<Pillar, Offering[]>(PILLARS.map((p) => [p, []]))

  for (const row of (prompts ?? []) as { id: string; pillar: Pillar | null; text: string }[]) {
    if (!row.pillar || !byPillar.has(row.pillar)) continue
    byPillar.get(row.pillar)!.push({
      id: `prompt:${row.id}`,
      kind: 'question',
      text: row.text,
      // Straight into writing with the question already there, rather than
      // showing her a question and making her go and find the blank box.
      href: `/app/write?prompt=${row.id}`,
    })
  }

  for (const row of (resources ?? []) as {
    id: string
    title: string
    description: string | null
    url: string | null
    pillar: Pillar | null
    resource_type: string | null
  }[]) {
    if (!row.pillar || !byPillar.has(row.pillar)) continue
    byPillar.get(row.pillar)!.push({
      id: `resource:${row.id}`,
      kind: row.resource_type === 'practice' ? 'practice' : 'reading',
      text: row.title,
      href: row.url ?? '/app/vault',
      note: row.description ?? undefined,
    })
  }

  return PILLARS.map((p) => buildShelf(p, byPillar.get(p) ?? [], capacity, today))
})
