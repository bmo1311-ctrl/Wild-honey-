import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { PILLARS } from '@/lib/pillars'
import type { Pillar } from '@/lib/types'
import { buildShelf, type HerWords, type Offering, type PillarPlan, type Shelf } from '@/lib/shelf'
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

/**
 * Her plan: the four pillars, each with what she said, what is held, and what
 * she has already written.
 *
 * `hers` is the mirroring part and the one worth being careful about. It is
 * her own sentences, joined to a pillar through the prompt she answered —
 * nothing derived, nothing counted, nothing inferred from a gap. If she has
 * written nothing under Faith, the app knows she has written nothing *here*,
 * which is not a fact about her faith and is not presented as one.
 *
 * Capped at three per pillar. This is a plan, not an archive; the archive is
 * a tab on Write and already holds everything.
 */
export const getPillarPlans = cache(async function getPillarPlans(
  capacity: CapacityLevel,
): Promise<PillarPlan[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [shelves, { data: intentions }, { data: entries }] = await Promise.all([
    getShelves(capacity),
    user
      ? supabase.from('pillar_intentions').select('pillar, text').eq('user_id', user.id)
      : Promise.resolve({ data: null }),
    user
      ? supabase
          .from('journal_entries')
          .select('id, text, created_at, prompt:prompts(pillar, text)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(60)
      : Promise.resolve({ data: null }),
  ])

  const said = new Map<string, string>()
  for (const row of (intentions ?? []) as { pillar: string; text: string }[]) {
    said.set(row.pillar, row.text)
  }

  const written = new Map<Pillar, HerWords[]>(PILLARS.map((p) => [p, []]))
  /*
   * The join comes back typed as an array because Supabase cannot tell a
   * one-to-one embed from a one-to-many at the type level. It is one row —
   * `prompt_id` is a single foreign key — so it is normalised here rather
   * than every read site having to remember.
   */
  for (const row of (entries ?? []) as unknown as {
    id: string
    text: string | null
    created_at: string
    prompt: { pillar: Pillar | null; text: string } | { pillar: Pillar | null; text: string }[] | null
  }[]) {
    const joined = Array.isArray(row.prompt) ? row.prompt[0] : row.prompt
    const pillar = joined?.pillar
    if (!pillar || !written.has(pillar) || !row.text?.trim()) continue
    const list = written.get(pillar)!
    if (list.length >= 3) continue
    list.push({ id: row.id, when: row.created_at, prompt: joined?.text ?? '', body: row.text })
  }

  return shelves.map((shelf) => ({
    pillar: shelf.pillar,
    intention: said.get(shelf.pillar) ?? null,
    shelf,
    hers: written.get(shelf.pillar) ?? [],
  }))
})
