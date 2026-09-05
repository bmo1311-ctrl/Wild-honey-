import { createClient } from '@/lib/supabase/server'
import type {
  Checkin,
  Challenge,
  CircleFeedItem,
  Commitment,
  CommunityPost,
  ContentReport,
  CyclePhase,
  EveningReflection,
  ExpertQuestion,
  Group,
  GroupMember,
  GroceryBuilderItem,
  GroceryList,
  GroupPost,
  Habit,
  HabitLog,
  JournalEntry,
  MealLog,
  MealPlan,
  MorningReset,
  PantryItem,
  PersonalExperiment,
  Product,
  Profile,
  ProtocolDayCompletion,
  ProtocolEnrollment,
  Prompt,
  Recipe,
  Resource,
  Retreat,
  TodayFocus,
  TransformationReflection,
  UserGoal,
  VitalityCheckin,
  Win,
  Workout,
} from '@/lib/types'
import { suggestProtocol } from '@/lib/protocols'

/**
 * Unwraps a Supabase response, throwing on error instead of quietly
 * returning nothing. An empty state may only claim emptiness when the
 * query actually succeeded — a missing table, a bad column or a permission
 * error has to surface as a failure, not as "nothing here yet". (A blocked
 * RLS policy on a SELECT returns no rows rather than an error, so that case
 * still reads as empty.)
 */
function ok<T>(res: { data: T; error: unknown }): T {
  if (res.error) throw res.error
  return res.data
}

const PAID_TIERS = new Set(['circle', 'inner-circle', 'founder'])
export function hasPaidAccess(tier: string | undefined | null): boolean {
  return !!tier && PAID_TIERS.has(tier)
}

export async function getSessionProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  return (data as Profile) ?? null
}

const GOAL_PILLAR: Record<string, 'Body' | 'Identity' | 'Mindset' | 'Faith'> = {
  more_energy: 'Body',
  better_sleep: 'Body',
  strength: 'Body',
  nourishment: 'Body',
  womens_health_education: 'Body',
  confidence: 'Identity',
  community: 'Identity',
  joy: 'Identity',
  stress_reduction: 'Mindset',
  emotional_wellness: 'Mindset',
  better_routines: 'Mindset',
  spiritual_growth: 'Faith',
}

/**
 * Picks the best-matching prompt for this member from everything unlocked
 * so far (date_scheduled <= today), rather than showing everyone the same
 * one. Prioritizes: prompts matching her top goal-pillar(s), respects her
 * faith preference (won't lead with Faith content if she opted out), and
 * skips anything she's already journaled on.
 */
export async function getTodayPrompt(): Promise<Prompt | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const today = new Date().toISOString().slice(0, 10)
  const { data: pool } = await supabase.from('prompts').select('*').lte('date_scheduled', today).order('date_scheduled', { ascending: false })
  const candidates = (pool as Prompt[]) ?? []
  if (candidates.length === 0) return null
  if (!user) return candidates[0]

  const [{ data: goalRows }, { data: profile }, { data: entries }] = await Promise.all([
    supabase.from('user_goals').select('goal').eq('user_id', user.id),
    supabase.from('profiles').select('faith_preference').eq('id', user.id).maybeSingle(),
    supabase.from('journal_entries').select('prompt_id').eq('user_id', user.id).not('prompt_id', 'is', null),
  ])

  const answeredIds = new Set((entries ?? []).map((e) => e.prompt_id))
  const unanswered = candidates.filter((p) => !answeredIds.has(p.id))
  const pool2 = unanswered.length > 0 ? unanswered : candidates // fall back to repeats once caught up

  const pillarCounts = new Map<string, number>()
  ;(goalRows ?? []).forEach((g) => {
    const pillar = GOAL_PILLAR[g.goal]
    if (pillar) pillarCounts.set(pillar, (pillarCounts.get(pillar) ?? 0) + 1)
  })
  const topCount = Math.max(0, ...Array.from(pillarCounts.values()))
  const topPillars = new Set(Array.from(pillarCounts.entries()).filter(([, c]) => c === topCount && topCount > 0).map(([p]) => p))

  const faithOptedOut = profile?.faith_preference === 'not_now' || !profile?.faith_preference

  function score(p: Prompt): number {
    let s = 0
    if (p.pillar && topPillars.has(p.pillar)) s += 2
    if (p.pillar === 'Faith' && faithOptedOut) s -= 3
    return s
  }

  const sorted = [...pool2].sort((a, b) => score(b) - score(a))
  return sorted[0]
}

export async function getMyEntryForPrompt(promptId: string): Promise<JournalEntry | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', user.id)
    .eq('prompt_id', promptId)
    .maybeSingle()
  return (data as JournalEntry) ?? null
}

export async function getMyEntries(): Promise<JournalEntry[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []
  const { data } = await supabase
    .from('journal_entries')
    .select('*, prompt:prompts(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  return (data as JournalEntry[]) ?? []
}

export async function getPromptArchive(): Promise<Prompt[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('prompts')
    .select('*')
    .order('date_scheduled', { ascending: false })
  return (data as Prompt[]) ?? []
}

export async function getHiddenAuthorIds(): Promise<Set<string>> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return new Set()
  const [{ data: blocksIMade }, { data: blocksOnMe }, { data: mutes }] = await Promise.all([
    supabase.from('user_blocks').select('blocked_id').eq('blocker_id', user.id),
    supabase.from('user_blocks').select('blocker_id').eq('blocked_id', user.id),
    supabase.from('user_mutes').select('muted_id').eq('muter_id', user.id),
  ])
  const ids = new Set<string>()
  ;(blocksIMade ?? []).forEach((b) => ids.add(b.blocked_id))
  ;(blocksOnMe ?? []).forEach((b) => ids.add(b.blocker_id))
  ;(mutes ?? []).forEach((m) => ids.add(m.muted_id))
  return ids
}

export async function getCircleFeed(): Promise<JournalEntry[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const hidden = await getHiddenAuthorIds()

  const { data: entries } = await supabase
    .from('journal_entries')
    .select('*, prompt:prompts(*), profile:profiles(name, avatar_color, avatar_url, membership_tier)')
    .eq('visibility', 'circle')
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(60)

  const list = ((entries as JournalEntry[]) ?? []).filter((e) => !hidden.has(e.user_id))
  if (list.length === 0) return []

  const ids = list.map((e) => e.id)
  const [{ data: reactions }, { data: comments }] = await Promise.all([
    supabase.from('reactions').select('entry_id, user_id').in('entry_id', ids),
    supabase.from('comments').select('entry_id').in('entry_id', ids),
  ])

  return list.map((e) => {
    const rx = (reactions ?? []).filter((r) => r.entry_id === e.id)
    return {
      ...e,
      reaction_count: rx.length,
      reacted_by_me: user ? rx.some((r) => r.user_id === user.id) : false,
      comment_count: (comments ?? []).filter((c) => c.entry_id === e.id).length,
    }
  })
}

export async function getProducts(): Promise<Product[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: true })
  const products = (data as Product[]) ?? []
  if (!user) return products
  const { data: purchases } = await supabase
    .from('purchases')
    .select('product_id')
    .eq('user_id', user.id)
  const owned = new Set((purchases ?? []).map((p) => p.product_id))
  return products.map((p) => ({ ...p, owned: owned.has(p.id) }))
}

// ---- Community tab ----

export async function getCommunityFeed(): Promise<CommunityPost[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const hidden = await getHiddenAuthorIds()

  const { data: posts } = await supabase
    .from('community_posts')
    .select('*, profile:profiles(name, avatar_color, avatar_url, membership_tier)')
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(80)

  const list = ((posts as CommunityPost[]) ?? []).filter((p) => !hidden.has(p.user_id))
  if (list.length === 0) return []

  const ids = list.map((p) => p.id)
  const [{ data: reactions }, { data: comments }] = await Promise.all([
    supabase.from('community_reactions').select('post_id, user_id').in('post_id', ids),
    supabase.from('community_comments').select('post_id').in('post_id', ids),
  ])

  return list.map((p) => {
    const rx = (reactions ?? []).filter((r) => r.post_id === p.id)
    return {
      ...p,
      reaction_count: rx.length,
      reacted_by_me: user ? rx.some((r) => r.user_id === user.id) : false,
      comment_count: (comments ?? []).filter((c) => c.post_id === p.id).length,
    }
  })
}

// Unified feed — journal entries shared to the circle and standalone
// community posts, interleaved into one chronological (pinned-first) list.
export async function getUnifiedCircleFeed(): Promise<CircleFeedItem[]> {
  const [entries, posts] = await Promise.all([getCircleFeed(), getCommunityFeed()])

  const items: CircleFeedItem[] = [
    ...entries.map((entry) => ({ kind: 'journal' as const, id: entry.id, pinned: Boolean((entry as any).pinned), created_at: entry.created_at, entry })),
    ...posts.map((post) => ({ kind: 'community' as const, id: post.id, pinned: Boolean(post.pinned), created_at: post.created_at, post })),
  ]

  items.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    return b.created_at.localeCompare(a.created_at)
  })

  return items
}

// ---- Workouts hub ----

export async function getWorkouts(): Promise<Workout[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('workouts').select('*').order('created_at', { ascending: false })
  return (data as Workout[]) ?? []
}

export async function getMealPlans(): Promise<MealPlan[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('meal_plans').select('*').order('created_at', { ascending: false })
  return (data as MealPlan[]) ?? []
}

export async function getGroceryLists(): Promise<GroceryList[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('grocery_lists').select('*').order('created_at', { ascending: false })
  return (data as GroceryList[]) ?? []
}

export async function getRetreats(): Promise<Retreat[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data } = await supabase
    .from('retreats')
    .select('*')
    .order('created_at', { ascending: true })
  const retreats = (data as Retreat[]) ?? []
  if (!user) return retreats
  const { data: signups } = await supabase
    .from('retreat_signups')
    .select('retreat_id')
    .eq('user_id', user.id)
  const mine = new Set((signups ?? []).map((s) => s.retreat_id))
  const groupIds = retreats.map((r) => r.group_id).filter((id): id is string => Boolean(id))
  let myGroupIds = new Set<string>()
  if (groupIds.length > 0) {
    const { data: memberships } = await supabase.from('group_members').select('group_id').eq('user_id', user.id).in('group_id', groupIds)
    myGroupIds = new Set((memberships ?? []).map((m) => m.group_id))
  }
  return retreats.map((r) => ({ ...r, signed_up: mine.has(r.id), my_group_membership: r.group_id ? myGroupIds.has(r.group_id) : false }))
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

export async function getTodayCheckin(): Promise<Checkin | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('checkins').select('*').eq('user_id', user.id).eq('date', todayStr()).maybeSingle()
  return (data as Checkin) ?? null
}

export async function getRecentCheckins(days = 30): Promise<Checkin[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []
  const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)
  const { data } = await supabase
    .from('checkins')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', since)
    .order('date', { ascending: true })
  return (data as Checkin[]) ?? []
}

export async function getTodayMorningReset(): Promise<MorningReset | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('morning_resets').select('*').eq('user_id', user.id).eq('date', todayStr()).maybeSingle()
  return (data as MorningReset) ?? null
}

export async function getTodayEveningReflection(): Promise<EveningReflection | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('evening_reflections').select('*').eq('user_id', user.id).eq('date', todayStr()).maybeSingle()
  return (data as EveningReflection) ?? null
}

export async function getRecentWins(limit = 30): Promise<Win[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []
  const { data } = await supabase.from('wins').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(limit)
  return (data as Win[]) ?? []
}

// Rule-based "Today's Focus" engine. No external AI call — just clear,
// explainable logic over the most recent check-in so it's fast, free, and
// always available even with zero data.
export function computeTodayFocus(
  latest: Checkin | null,
  recent: Checkin[],
  personalize?: { hydrationGoalOz?: number | null; goals?: string[]; faithPreference?: string | null; season?: string | null },
): TodayFocus {
  const suggestions: string[] = []
  let oneThing = 'take five slow breaths and drink a glass of water before you do anything else.'
  let headline = "here's today's focus."
  const hydrationGoal = personalize?.hydrationGoalOz ?? 64
  const goals = personalize?.goals ?? []

  if (!latest) {
    return {
      headline: 'start today with a quick check-in.',
      oneThing: 'log how you feel right now — it takes 20 seconds and everything else builds from it.',
      suggestions: ['log your energy, mood, and sleep for today', 'try the 2-minute morning reset', 'read today\'s prompt'],
      estimatedMinutes: 5,
      suggestedProtocolSlug: null,
    }
  }

  const energy = latest.energy ?? 5
  const sleep = latest.sleep_quality ?? 5
  const stress = latest.stress ?? 5
  const hydration = latest.hydration_oz ?? 0
  const sunlight = latest.sunlight_minutes ?? 0
  const movement = latest.movement_minutes ?? 0

  if (energy <= 3) {
    headline = 'your energy is low today — let\'s protect it, not push through it.'
    oneThing = 'give yourself permission to do less today. rest is productive too.'
    suggestions.push('a 10-minute gentle walk instead of a full workout', 'protein-forward snack to steady your blood sugar', 'an early wind-down tonight')
  } else if (sleep <= 3) {
    headline = 'sleep was rough — today is about recovery, not output.'
    oneThing = 'get 10 minutes of morning sunlight to reset your circadian rhythm.'
    suggestions.push('skip caffeine after noon', 'a short nap if you can (20 min max)', 'lights down an hour earlier tonight')
  } else if (stress >= 7) {
    headline = 'stress is running high — let\'s bring your nervous system back down.'
    oneThing = 'try the calming breath: in for 4, hold for 4, out for 6, four times.'
    suggestions.push('step outside for 5 minutes before your next task', 'write down what\'s actually in your control today', 'skip anything optional on the calendar')
  } else if (energy >= 8 && sleep >= 7) {
    headline = 'you\'re in a strong window — good day to move on something that matters.'
    oneThing = 'pick the one task you\'ve been avoiding and do it first, while your energy is high.'
    suggestions.push('a real workout, not just a walk', 'tackle the hard conversation or task you\'ve postponed', 'batch-prep something for the week ahead')
  } else {
    headline = 'a steady, ordinary day — good for consistency, not heroics.'
    suggestions.push('keep your normal rhythm', 'a short walk outside', 'check in with your evening reflection tonight')
  }

  if (hydration > 0 && hydration < hydrationGoal) suggestions.push(`you're at ${hydration}oz so far — aim for at least ${hydrationGoal}oz today`)
  if (sunlight === 0) suggestions.push('get outside for natural light, even 10 minutes helps')
  if (movement === 0 && energy > 3) suggestions.push('a short walk counts as movement')
  if (latest.symptoms?.length) suggestions.push(`noticed you logged ${latest.symptoms.join(', ')} — go gentle today`)

  // Personalization from the Honey Profile: goals and faith preference
  if (goals.includes('stress_reduction') && stress >= 5 && !suggestions.some((s) => s.includes('breath'))) {
    suggestions.push('you told us stress reduction matters to you — a few minutes of quiet before your next task could help')
  } else if (goals.includes('better_sleep') && sleep < 7) {
    suggestions.push('better sleep is one of your goals — tonight is a good night to protect your wind-down routine')
  } else if (goals.includes('confidence') && energy >= 5) {
    suggestions.push('you\'re building confidence — do one thing today that scares you a little')
  }
  if (personalize?.faithPreference === 'regularly' || personalize?.faithPreference === 'occasionally') {
    suggestions.push('take a quiet moment for prayer or reflection today')
  }

  const trendEnergy = recent.length >= 3 ? recent.slice(-3).reduce((s, c) => s + (c.energy ?? 5), 0) / 3 : null
  if (trendEnergy !== null) {
    if (trendEnergy > energy + 1) suggestions.push('your energy has dipped the last few days — worth an earlier night this week')
    else if (trendEnergy < energy - 1) suggestions.push('your energy is trending up — nice momentum, keep it going')
  }

  return { headline, oneThing, suggestions: suggestions.slice(0, 5), estimatedMinutes: 20 + suggestions.length * 2, suggestedProtocolSlug: suggestProtocol(latest) }
}

// ---- Habit stacking ----

export async function getHabits(): Promise<Habit[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []
  const { data } = await supabase.from('habits').select('*').eq('user_id', user.id).eq('archived', false).order('created_at', { ascending: true })
  return (data as Habit[]) ?? []
}

export async function getRecentHabitLogs(days = 30): Promise<HabitLog[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []
  const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)
  const { data } = await supabase.from('habit_logs').select('*').eq('user_id', user.id).gte('date', since).order('date', { ascending: true })
  return (data as HabitLog[]) ?? []
}

// ---- Protocols ----

export async function getActiveEnrollment(): Promise<ProtocolEnrollment | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('protocol_enrollments')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return (data as ProtocolEnrollment) ?? null
}

export async function getEnrollmentCompletions(enrollmentId: string): Promise<ProtocolDayCompletion[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('protocol_day_completions').select('*').eq('enrollment_id', enrollmentId).order('day_number', { ascending: true })
  return (data as ProtocolDayCompletion[]) ?? []
}

// ---- Pantry + Grocery builder ----

export async function getPantryItems(): Promise<PantryItem[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []
  const { data } = await supabase.from('pantry_items').select('*').eq('user_id', user.id).order('created_at', { ascending: true })
  return (data as PantryItem[]) ?? []
}

export async function getGroceryBuilderItems(): Promise<GroceryBuilderItem[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []
  const { data } = await supabase.from('grocery_builder_items').select('*').eq('user_id', user.id).order('created_at', { ascending: true })
  return (data as GroceryBuilderItem[]) ?? []
}

// ---- Resource vault ----

export async function getResources(): Promise<Resource[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const data = ok(await supabase.from('resources').select('*').order('created_at', { ascending: false }))
  const resources = (data as Resource[]) ?? []
  if (!user) return resources
  const saved = ok(await supabase.from('saved_resources').select('resource_id').eq('user_id', user.id))
  const savedIds = new Set((saved ?? []).map((s) => s.resource_id))
  return resources.map((r) => ({ ...r, saved: savedIds.has(r.id) }))
}

// ---- Private groups ----

export async function getMyGroups(): Promise<Group[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []
  const memberships = ok(await supabase.from('group_members').select('group_id, role').eq('user_id', user.id))
  const list = memberships ?? []
  if (list.length === 0) return []
  const groupIds = list.map((m) => m.group_id)
  const groups = ok(await supabase.from('groups').select('*').in('id', groupIds).order('created_at', { ascending: false }))
  const roleByGroup = new Map(list.map((m) => [m.group_id, m.role as 'owner' | 'member']))

  const allMembers = ok(await supabase.from('group_members').select('group_id').in('group_id', groupIds))
  const countByGroup = new Map<string, number>()
  ;(allMembers ?? []).forEach((m) => countByGroup.set(m.group_id, (countByGroup.get(m.group_id) ?? 0) + 1))

  return ((groups as Group[]) ?? []).map((g) => ({ ...g, my_role: roleByGroup.get(g.id), member_count: countByGroup.get(g.id) ?? 0 }))
}

export async function getGroupById(groupId: string): Promise<Group | null> {
  const supabase = await createClient()
  const data = ok(await supabase.from('groups').select('*').eq('id', groupId).maybeSingle())
  return (data as Group) ?? null
}

export async function getGroupMembers(groupId: string): Promise<GroupMember[]> {
  const supabase = await createClient()
  const data = ok(
    await supabase
      .from('group_members')
      .select('*, profile:profiles(name, avatar_color, avatar_url, membership_tier)')
      .eq('group_id', groupId)
      .order('joined_at', { ascending: true }),
  )
  return (data as GroupMember[]) ?? []
}

export async function getGroupPosts(groupId: string): Promise<GroupPost[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const hidden = await getHiddenAuthorIds()

  const posts = ok(
    await supabase
      .from('group_posts')
      .select('*, profile:profiles(name, avatar_color, avatar_url, membership_tier)')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false }),
  )

  const list = ((posts as GroupPost[]) ?? []).filter((p) => !hidden.has(p.user_id))
  if (list.length === 0) return []

  const ids = list.map((p) => p.id)
  const [reactions, comments] = await Promise.all([
    supabase.from('group_post_reactions').select('post_id, user_id').in('post_id', ids).then(ok),
    supabase.from('group_post_comments').select('post_id').in('post_id', ids).then(ok),
  ])

  return list.map((p) => {
    const rx = (reactions ?? []).filter((r) => r.post_id === p.id)
    return {
      ...p,
      reaction_count: rx.length,
      reacted_by_me: user ? rx.some((r) => r.user_id === user.id) : false,
      comment_count: (comments ?? []).filter((c) => c.post_id === p.id).length,
    }
  })
}

// ---- Ask an Expert ----

export async function getMyQuestions(): Promise<ExpertQuestion[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []
  const { data } = await supabase.from('expert_questions').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
  return (data as ExpertQuestion[]) ?? []
}

export async function getPublicAnsweredQuestions(): Promise<ExpertQuestion[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('expert_questions')
    .select('*')
    .eq('is_public', true)
    .not('answer', 'is', null)
    .order('answered_at', { ascending: false })
    .limit(50)
  return (data as ExpertQuestion[]) ?? []
}

export async function getAllQuestionsForAdmin(): Promise<ExpertQuestion[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('expert_questions')
    .select('*, profile:profiles(name, avatar_color, avatar_url)')
    .order('created_at', { ascending: false })
  return (data as ExpertQuestion[]) ?? []
}

// ---- Honey Profile: goals + vitality ----

export async function getMyGoals(): Promise<UserGoal[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []
  const { data } = await supabase.from('user_goals').select('*').eq('user_id', user.id)
  return (data as UserGoal[]) ?? []
}

export async function getVitalityHistory(): Promise<VitalityCheckin[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []
  const { data } = await supabase.from('vitality_checkins').select('*').eq('user_id', user.id).order('taken_at', { ascending: true })
  return (data as VitalityCheckin[]) ?? []
}

export async function getLatestVitalityCheckin(): Promise<VitalityCheckin | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('vitality_checkins')
    .select('*')
    .eq('user_id', user.id)
    .order('taken_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return (data as VitalityCheckin) ?? null
}

export async function getReflections(): Promise<TransformationReflection[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []
  const { data } = await supabase.from('transformation_reflections').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
  return (data as TransformationReflection[]) ?? []
}

// ---- Community safety ----

export async function getBlockedUsers() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []
  const { data } = await supabase.from('user_blocks').select('id, blocked_id, profile:profiles!user_blocks_blocked_id_fkey(name, avatar_color, avatar_url)').eq('blocker_id', user.id)
  return data ?? []
}

export async function getMutedUsers() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []
  const { data } = await supabase.from('user_mutes').select('id, muted_id, profile:profiles!user_mutes_muted_id_fkey(name, avatar_color, avatar_url)').eq('muter_id', user.id)
  return data ?? []
}

export async function getReportsForAdmin(): Promise<ContentReport[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('content_reports')
    .select('*, reporter_profile:profiles(name, avatar_color, avatar_url)')
    .order('status', { ascending: true })
    .order('created_at', { ascending: false })
  return (data as ContentReport[]) ?? []
}

// ---- Recipes ----

export async function getRecipes(): Promise<Recipe[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const data = ok(await supabase.from('recipes').select('*').order('created_at', { ascending: false }))
  const recipes = (data as Recipe[]) ?? []
  if (!user) return recipes
  const saved = ok(await supabase.from('saved_recipes').select('recipe_id').eq('user_id', user.id))
  const savedIds = new Set((saved ?? []).map((s) => s.recipe_id))
  return recipes.map((r) => ({ ...r, saved: savedIds.has(r.id) }))
}

export function getCurrentSeason(): 'spring' | 'summer' | 'fall' | 'winter' {
  const month = new Date().getMonth() // 0-11
  if (month >= 2 && month <= 4) return 'spring'
  if (month >= 5 && month <= 7) return 'summer'
  if (month >= 8 && month <= 10) return 'fall'
  return 'winter'
}

/** Most recent cycle phase the member has logged in a check-in, if any. */
export async function getCurrentCyclePhase(): Promise<CyclePhase | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('checkins')
    .select('cycle_phase')
    .eq('user_id', user.id)
    .not('cycle_phase', 'is', null)
    .neq('cycle_phase', 'not_tracked')
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle()
  return (data?.cycle_phase as CyclePhase) ?? null
}

/** Recipes matching this week's season and, if tracked, the member's current cycle phase. */
export async function getRecommendedRecipes(): Promise<Recipe[]> {
  const [recipes, season, cyclePhase] = await Promise.all([getRecipes(), Promise.resolve(getCurrentSeason()), getCurrentCyclePhase()])
  return recipes.filter((r) => {
    const seasonMatch = r.season === 'any' || r.season === season
    const cycleMatch = !cyclePhase || r.cycle_phase === 'any' || r.cycle_phase === cyclePhase
    return seasonMatch && cycleMatch
  })
}

// ---- Challenges ----

export async function getChallenges(): Promise<Challenge[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const challenges = ok(await supabase.from('challenges').select('*').eq('is_active', true).order('created_at', { ascending: false }))
  const list = (challenges as Challenge[]) ?? []
  if (list.length === 0) return []

  const ids = list.map((c) => c.id)
  const [allParticipants, myParticipation, myCheckins] = await Promise.all([
    supabase.from('challenge_participants').select('challenge_id').in('challenge_id', ids).then(ok),
    user
      ? supabase.from('challenge_participants').select('challenge_id').eq('user_id', user.id).in('challenge_id', ids).then(ok)
      : Promise.resolve([] as { challenge_id: string }[]),
    user
      ? supabase.from('challenge_checkins').select('challenge_id').eq('user_id', user.id).in('challenge_id', ids).then(ok)
      : Promise.resolve([] as { challenge_id: string }[]),
  ])

  const joinedIds = new Set((myParticipation ?? []).map((p: any) => p.challenge_id))
  const countByChallenge = new Map<string, number>()
  ;(allParticipants ?? []).forEach((p) => countByChallenge.set(p.challenge_id, (countByChallenge.get(p.challenge_id) ?? 0) + 1))
  const completedByChallenge = new Map<string, number>()
  ;(myCheckins ?? []).forEach((c: any) => completedByChallenge.set(c.challenge_id, (completedByChallenge.get(c.challenge_id) ?? 0) + 1))

  return list.map((c) => ({
    ...c,
    joined: joinedIds.has(c.id),
    participant_count: countByChallenge.get(c.id) ?? 0,
    days_completed: completedByChallenge.get(c.id) ?? 0,
  }))
}

export async function getMyActiveChallenge(): Promise<Challenge | null> {
  const challenges = await getChallenges()
  return challenges.find((c) => c.joined) ?? null
}

export async function getAllChallengesForAdmin(): Promise<Challenge[]> {
  const supabase = await createClient()
  const challenges = ok(await supabase.from('challenges').select('*').order('created_at', { ascending: false }))
  const list = (challenges as Challenge[]) ?? []
  if (list.length === 0) return []
  const ids = list.map((c) => c.id)
  const participants = ok(await supabase.from('challenge_participants').select('challenge_id').in('challenge_id', ids))
  const countByChallenge = new Map<string, number>()
  ;(participants ?? []).forEach((p) => countByChallenge.set(p.challenge_id, (countByChallenge.get(p.challenge_id) ?? 0) + 1))
  return list.map((c) => ({ ...c, participant_count: countByChallenge.get(c.id) ?? 0 }))
}

// ---- AI companion (deferred — table exists, feature not wired up yet) ----

// ---- Advanced analytics (admin) ----

function weekKey(dateStr: string): string {
  const d = new Date(dateStr)
  const day = d.getUTCDay()
  const monday = new Date(d)
  monday.setUTCDate(d.getUTCDate() - ((day + 6) % 7))
  return monday.toISOString().slice(0, 10)
}

function monthKey(dateStr: string): string {
  return dateStr.slice(0, 7)
}

export async function adminGetAnalytics() {
  const supabase = await createClient()

  const since8Weeks = new Date(Date.now() - 56 * 86400000).toISOString()
  const since30Days = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)
  const since6Months = new Date(Date.now() - 182 * 86400000).toISOString()

  const [
    { data: profiles },
    { data: checkins },
    { data: entries },
    { data: purchases },
    { data: retreatSignups },
    { data: communityPosts },
    { data: groupPosts },
    { data: savedRecipes },
    { data: challengeParticipants },
    { data: savedResources },
  ] = await Promise.all([
    supabase.from('profiles').select('created_at, streak_count'),
    supabase.from('checkins').select('date').gte('date', since30Days),
    supabase.from('journal_entries').select('created_at, prompt:prompts(pillar)'),
    supabase.from('purchases').select('purchased_at, product:products(price_cents)').gte('purchased_at', since6Months),
    supabase.from('retreat_signups').select('created_at, status, retreat:retreats(price_cents)').eq('status', 'confirmed').gte('created_at', since6Months),
    supabase.from('community_posts').select('id'),
    supabase.from('group_posts').select('id'),
    supabase.from('saved_recipes').select('id'),
    supabase.from('challenge_participants').select('id'),
    supabase.from('saved_resources').select('id'),
  ])

  // signups by week, last 8 weeks
  const signupsByWeek = new Map<string, number>()
  ;(profiles ?? [])
    .filter((p) => p.created_at >= since8Weeks)
    .forEach((p) => {
      const k = weekKey(p.created_at)
      signupsByWeek.set(k, (signupsByWeek.get(k) ?? 0) + 1)
    })

  // checkins by day, last 30 days
  const checkinsByDay = new Map<string, number>()
  ;(checkins ?? []).forEach((c) => {
    checkinsByDay.set(c.date, (checkinsByDay.get(c.date) ?? 0) + 1)
  })

  // journal entries by pillar
  const entriesByPillar = new Map<string, number>()
  ;(entries ?? []).forEach((e: any) => {
    const pillar = e.prompt?.pillar ?? 'unassigned'
    entriesByPillar.set(pillar, (entriesByPillar.get(pillar) ?? 0) + 1)
  })

  // streak distribution
  const streakBuckets = { '0': 0, '1-3': 0, '4-7': 0, '8-14': 0, '15-30': 0, '31+': 0 } as Record<string, number>
  ;(profiles ?? []).forEach((p) => {
    const s = p.streak_count ?? 0
    if (s === 0) streakBuckets['0']++
    else if (s <= 3) streakBuckets['1-3']++
    else if (s <= 7) streakBuckets['4-7']++
    else if (s <= 14) streakBuckets['8-14']++
    else if (s <= 30) streakBuckets['15-30']++
    else streakBuckets['31+']++
  })

  // revenue by month, last 6 months (digital purchases + confirmed retreat signups)
  const revenueByMonth = new Map<string, number>()
  ;(purchases ?? []).forEach((p: any) => {
    const k = monthKey(p.purchased_at)
    revenueByMonth.set(k, (revenueByMonth.get(k) ?? 0) + (p.product?.price_cents ?? 0))
  })
  ;(retreatSignups ?? []).forEach((r: any) => {
    const k = monthKey(r.created_at)
    revenueByMonth.set(k, (revenueByMonth.get(k) ?? 0) + (r.retreat?.price_cents ?? 0))
  })

  return {
    signupsByWeek: Array.from(signupsByWeek.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([week, count]) => ({ week, count })),
    checkinsByDay: Array.from(checkinsByDay.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([date, count]) => ({ date, count })),
    entriesByPillar: Array.from(entriesByPillar.entries()).map(([pillar, count]) => ({ pillar, count })),
    streakDistribution: Object.entries(streakBuckets).map(([bucket, count]) => ({ bucket, count })),
    revenueByMonth: Array.from(revenueByMonth.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([month, cents]) => ({ month, dollars: cents / 100 })),
    engagement: {
      communityPosts: (communityPosts ?? []).length,
      groupPosts: (groupPosts ?? []).length,
      savedRecipes: (savedRecipes ?? []).length,
      challengeJoins: (challengeParticipants ?? []).length,
      savedResources: (savedResources ?? []).length,
    },
  }
}

// ---- Nutrition tracking ----

export async function getTodayNutrition(): Promise<{
  calories: number
  protein: number
  carbs: number
  fat: number
  calorieGoal: number | null
  proteinGoal: number | null
  loggedMeals: MealLog[]
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { calories: 0, protein: 0, carbs: 0, fat: 0, calorieGoal: null, proteinGoal: null, loggedMeals: [] }

  const today = new Date().toISOString().slice(0, 10)
  const [{ data: logs }, { data: profile }] = await Promise.all([
    supabase.from('meal_logs').select('*, recipe:recipes(*)').eq('user_id', user.id).eq('date', today).order('created_at', { ascending: true }),
    supabase.from('profiles').select('daily_calorie_goal, daily_protein_goal_g').eq('id', user.id).maybeSingle(),
  ])

  const loggedMeals = (logs as MealLog[]) ?? []
  const totals = loggedMeals.reduce(
    (acc, log) => {
      const servings = log.servings || 1
      acc.calories += (log.recipe?.calories ?? 0) * servings
      acc.protein += (log.recipe?.protein_g ?? 0) * servings
      acc.carbs += (log.recipe?.carbs_g ?? 0) * servings
      acc.fat += (log.recipe?.fat_g ?? 0) * servings
      return acc
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  )

  return {
    ...totals,
    calorieGoal: profile?.daily_calorie_goal ?? null,
    proteinGoal: profile?.daily_protein_goal_g ?? null,
    loggedMeals,
  }
}

// ---- Commitments ----

export async function getMyCommitments(): Promise<Commitment[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []
  const { data } = await supabase.from('commitments').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
  return (data as Commitment[]) ?? []
}

// ---- Personal experiments ----

export async function getMyExperiments(): Promise<PersonalExperiment[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []
  const { data: experiments } = await supabase.from('personal_experiments').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
  const list = (experiments as PersonalExperiment[]) ?? []
  if (list.length === 0) return []

  const ids = list.map((e) => e.id)
  const { data: checkins } = await supabase.from('experiment_checkins').select('experiment_id').eq('user_id', user.id).in('experiment_id', ids)
  const counts = new Map<string, number>()
  ;(checkins ?? []).forEach((c) => counts.set(c.experiment_id, (counts.get(c.experiment_id) ?? 0) + 1))

  return list.map((e) => ({ ...e, days_completed: counts.get(e.id) ?? 0 }))
}

// ---- Year Day reflection ----

export async function getYearDayReflection(wildHoneyYear: number): Promise<TransformationReflection | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('transformation_reflections')
    .select('*')
    .eq('user_id', user.id)
    .eq('milestone', 'year_day')
    .eq('wild_honey_year', wildHoneyYear)
    .maybeSingle()
  return (data as TransformationReflection) ?? null
}
