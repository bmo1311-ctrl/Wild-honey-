import type { VaultItem } from '@/lib/vault'

/**
 * The engine behind the shelves.
 *
 * It ranks content from three real signals: the goals she chose at signup,
 * what she has actually played and finished (content_events), and what is
 * new. Nothing is hidden by it — it only decides order. It learns from the
 * first tap, and gets better the more she uses it.
 */

export interface ContentEvent {
  kind: string
  item_type: string
  item_id: string
  pillar: string | null
  created_at: string
}

export interface EngineContext {
  goalPillars: string[]
  events: ContentEvent[]
}

function ageDays(iso: string): number {
  return Math.max(0, (Date.now() - Date.parse(iso)) / 86_400_000)
}

export function affinityByPillar(events: ContentEvent[]): Record<string, number> {
  const out: Record<string, number> = {}
  for (const e of events) {
    if (!e.pillar || (e.kind !== 'play' && e.kind !== 'complete' && e.kind !== 'save')) continue
    // recent activity counts more than something from months ago
    const w = (e.kind === 'complete' ? 2 : e.kind === 'save' ? 1.5 : 1) * Math.exp(-ageDays(e.created_at) / 30)
    out[e.pillar] = (out[e.pillar] ?? 0) + w
  }
  return out
}

export function scoreItem(item: VaultItem, ctx: EngineContext, affinity: Record<string, number>, played: Set<string>, completed: Set<string>): number {
  let s = 0
  const goalRank = item.pillar ? ctx.goalPillars.indexOf(item.pillar) : -1
  if (goalRank >= 0) s += 3 - goalRank * 0.5
  if (item.pillar) s += Math.min(affinity[item.pillar] ?? 0, 3)
  if (item.createdAt) s += Math.max(0, 1.5 - ageDays(item.createdAt) / 30)
  if (played.has(item.id)) s -= 1
  if (completed.has(item.id)) s -= 4
  return s
}

export function buildEngineShelves(items: VaultItem[], ctx: EngineContext): { title: string; items: VaultItem[] }[] {
  const affinity = affinityByPillar(ctx.events)
  const played = new Set(ctx.events.filter((e) => e.kind === 'play').map((e) => e.item_id))
  const completed = new Set(ctx.events.filter((e) => e.kind === 'complete').map((e) => e.item_id))
  const lastPlayed = new Map<string, string>()
  for (const e of ctx.events) if (e.kind === 'play' && !lastPlayed.has(e.item_id)) lastPlayed.set(e.item_id, e.created_at)

  const byId = new Map(items.map((i) => [i.id, i]))
  const continueWatching = [...lastPlayed.entries()]
    .filter(([id]) => !completed.has(id) && byId.has(id))
    .sort((a, b) => b[1].localeCompare(a[1]))
    .map(([id]) => byId.get(id)!)
    .slice(0, 10)

  const scored = items
    .map((i) => ({ i, s: scoreItem(i, ctx, affinity, played, completed) }))
    .sort((a, b) => b.s - a.s)
    .map((x) => x.i)

  const forYou = scored.filter((i) => !completed.has(i.id)).slice(0, 12)
  const newest = [...items].filter((i) => i.createdAt).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 10)

  const pillars = ['Body', 'Identity', 'Mindset', 'Faith']
  // pillar rows in her order: goals first, then by what she actually plays
  const order = [...ctx.goalPillars, ...pillars.filter((p) => !ctx.goalPillars.includes(p)).sort((a, b) => (affinity[b] ?? 0) - (affinity[a] ?? 0))]

  const shelves = [
    { title: 'Continue watching', items: continueWatching },
    { title: 'For you', items: forYou },
    ...order.map((p) => ({ title: p, items: scored.filter((i) => i.pillar === p) })),
    { title: 'Newest', items: newest },
  ]
  return shelves.filter((s) => s.items.length > 0)
}
