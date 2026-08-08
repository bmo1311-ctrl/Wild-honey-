import { createClient } from '@/lib/supabase/server'
import type {
  Checkin,
  CommunityPost,
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
  MealPlan,
  MorningReset,
  PantryItem,
  Product,
  Profile,
  ProtocolDayCompletion,
  ProtocolEnrollment,
  Prompt,
  Resource,
  Retreat,
  TodayFocus,
  Win,
  Workout,
} from '@/lib/types'
import { suggestProtocol } from '@/lib/protocols'

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

export async function getTodayPrompt(): Promise<Prompt | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('prompts')
    .select('*')
    .order('date_scheduled', { ascending: false })
    .limit(1)
    .maybeSingle()
  return (data as Prompt) ?? null
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

export async function getCircleFeed(): Promise<JournalEntry[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: entries } = await supabase
    .from('journal_entries')
    .select('*, prompt:prompts(*), profile:profiles(name, avatar_color, membership_tier)')
    .eq('visibility', 'circle')
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(60)

  const list = (entries as JournalEntry[]) ?? []
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

  const { data: posts } = await supabase
    .from('community_posts')
    .select('*, profile:profiles(name, avatar_color, membership_tier)')
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(80)

  const list = (posts as CommunityPost[]) ?? []
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
export function computeTodayFocus(latest: Checkin | null, recent: Checkin[]): TodayFocus {
  const suggestions: string[] = []
  let oneThing = 'take five slow breaths and drink a glass of water before you do anything else.'
  let headline = "here's today's focus."

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

  if (hydration > 0 && hydration < 40) suggestions.push(`you're at ${hydration}oz so far — aim for at least 64oz today`)
  if (sunlight === 0) suggestions.push('get outside for natural light, even 10 minutes helps')
  if (movement === 0 && energy > 3) suggestions.push('a short walk counts as movement')
  if (latest.symptoms?.length) suggestions.push(`noticed you logged ${latest.symptoms.join(', ')} — go gentle today`)

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
  const { data } = await supabase.from('resources').select('*').order('created_at', { ascending: false })
  const resources = (data as Resource[]) ?? []
  if (!user) return resources
  const { data: saved } = await supabase.from('saved_resources').select('resource_id').eq('user_id', user.id)
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
  const { data: memberships } = await supabase.from('group_members').select('group_id, role').eq('user_id', user.id)
  const list = memberships ?? []
  if (list.length === 0) return []
  const groupIds = list.map((m) => m.group_id)
  const { data: groups } = await supabase.from('groups').select('*').in('id', groupIds).order('created_at', { ascending: false })
  const roleByGroup = new Map(list.map((m) => [m.group_id, m.role as 'owner' | 'member']))

  const { data: allMembers } = await supabase.from('group_members').select('group_id').in('group_id', groupIds)
  const countByGroup = new Map<string, number>()
  ;(allMembers ?? []).forEach((m) => countByGroup.set(m.group_id, (countByGroup.get(m.group_id) ?? 0) + 1))

  return ((groups as Group[]) ?? []).map((g) => ({ ...g, my_role: roleByGroup.get(g.id), member_count: countByGroup.get(g.id) ?? 0 }))
}

export async function getGroupById(groupId: string): Promise<Group | null> {
  const supabase = await createClient()
  const { data } = await supabase.from('groups').select('*').eq('id', groupId).maybeSingle()
  return (data as Group) ?? null
}

export async function getGroupMembers(groupId: string): Promise<GroupMember[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('group_members')
    .select('*, profile:profiles(name, avatar_color, membership_tier)')
    .eq('group_id', groupId)
    .order('joined_at', { ascending: true })
  return (data as GroupMember[]) ?? []
}

export async function getGroupPosts(groupId: string): Promise<GroupPost[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: posts } = await supabase
    .from('group_posts')
    .select('*, profile:profiles(name, avatar_color, membership_tier)')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })

  const list = (posts as GroupPost[]) ?? []
  if (list.length === 0) return []

  const ids = list.map((p) => p.id)
  const [{ data: reactions }, { data: comments }] = await Promise.all([
    supabase.from('group_post_reactions').select('post_id, user_id').in('post_id', ids),
    supabase.from('group_post_comments').select('post_id').in('post_id', ids),
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
    .select('*, profile:profiles(name, avatar_color)')
    .order('created_at', { ascending: false })
  return (data as ExpertQuestion[]) ?? []
}
