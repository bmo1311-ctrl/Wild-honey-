'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { oneSignalConfigured, sendPushToUsers } from '@/lib/onesignal'
import type { Comment, NotificationPrefs, Visibility } from '@/lib/types'
import { COURSE_SLUG, toISODate } from '@/lib/courses'
import type { WritingKind } from '@/lib/courses'

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return { supabase, user }
}

export async function saveEntry(input: {
  promptId: string | null
  text: string
  visibility: Visibility
  entryId?: string
}) {
  const { supabase, user } = await requireUser()
  const text = input.text.trim()
  if (!text) return { error: 'Please write something first.' }

  if (input.entryId) {
    const { error } = await supabase
      .from('journal_entries')
      .update({ text, visibility: input.visibility })
      .eq('id', input.entryId)
      .eq('user_id', user.id)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase.from('journal_entries').insert({
      user_id: user.id,
      prompt_id: input.promptId,
      text,
      visibility: input.visibility,
    })
    if (error) return { error: error.message }
    await bumpStreak(user.id)
  }

  revalidatePath('/app')
  revalidatePath('/app/circle')
  revalidatePath('/app/archive')
  revalidatePath('/app/profile')
  return { ok: true }
}

async function bumpStreak(userId: string) {
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('streak_count, last_active_date')
    .eq('id', userId)
    .single()
  if (!profile) return

  const today = new Date().toISOString().slice(0, 10)
  if (profile.last_active_date === today) return

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  const nextStreak = profile.last_active_date === yesterday ? profile.streak_count + 1 : 1
  await supabase
    .from('profiles')
    .update({ streak_count: nextStreak, last_active_date: today })
    .eq('id', userId)
}

export async function toggleReaction(entryId: string) {
  const { supabase, user } = await requireUser()
  const { data: existing } = await supabase
    .from('reactions')
    .select('id')
    .eq('entry_id', entryId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    await supabase.from('reactions').delete().eq('id', existing.id)
  } else {
    const { error } = await supabase
      .from('reactions')
      .insert({ entry_id: entryId, user_id: user.id })
    if (error) return { error: error.message }
  }
  revalidatePath('/app/circle')
  return { ok: true, reacted: !existing }
}

export async function addComment(entryId: string, text: string) {
  const { supabase, user } = await requireUser()
  const trimmed = text.trim()
  if (!trimmed) return { error: 'Comment cannot be empty.' }
  const { error } = await supabase
    .from('comments')
    .insert({ entry_id: entryId, user_id: user.id, text: trimmed })
  if (error) return { error: error.message }
  revalidatePath('/app/circle')
  return { ok: true }
}

export async function getComments(entryId: string): Promise<Comment[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('comments')
    .select('*, profile:profiles(name, avatar_color, membership_tier)')
    .eq('entry_id', entryId)
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: true })
  return (data as Comment[]) ?? []
}

export async function updateProfile(input: { name: string; avatarColor: string; avatarUrl?: string | null }) {
  const { supabase, user } = await requireUser()
  const { error } = await supabase
    .from('profiles')
    .update({ name: input.name.trim() || 'honey', avatar_color: input.avatarColor, avatar_url: input.avatarUrl ?? null })
    .eq('id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/app/profile')
  return { ok: true }
}

export async function joinRetreat(retreatId: string) {
  const { supabase, user } = await requireUser()
  const { error } = await supabase
    .from('retreat_signups')
    .insert({ retreat_id: retreatId, user_id: user.id, status: 'waitlist' })
  if (error) return { error: error.message }
  revalidatePath('/app/retreats')
  return { ok: true }
}

// ============================================================
// COMMUNITY TAB
// ============================================================

async function isFounderOrAdmin(supabase: any, userId: string) {
  const { data } = await supabase.from('profiles').select('membership_tier, is_admin').eq('id', userId).single()
  return !!data && (data.membership_tier === 'founder' || data.is_admin)
}

export async function createCommunityPost(input: { text: string; imageUrl?: string; pillar?: string }) {
  const { supabase, user } = await requireUser()
  const text = input.text.trim()
  if (!text) return { error: 'Write something first.' }
  const { error } = await supabase.from('community_posts').insert({
    user_id: user.id,
    text,
    image_url: input.imageUrl || null,
    pillar: input.pillar || null,
  })
  if (error) return { error: error.message }
  revalidatePath('/app/community')
  return { ok: true }
}

export async function toggleCommunityReaction(postId: string) {
  const { supabase, user } = await requireUser()
  const { data: existing } = await supabase
    .from('community_reactions')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (existing) {
    await supabase.from('community_reactions').delete().eq('id', existing.id)
  } else {
    const { error } = await supabase.from('community_reactions').insert({ post_id: postId, user_id: user.id })
    if (error) return { error: error.message }
  }
  revalidatePath('/app/community')
  return { ok: true, reacted: !existing }
}

export async function addCommunityComment(postId: string, text: string) {
  const { supabase, user } = await requireUser()
  const trimmed = text.trim()
  if (!trimmed) return { error: 'Comment cannot be empty.' }
  const { error } = await supabase.from('community_comments').insert({ post_id: postId, user_id: user.id, text: trimmed })
  if (error) return { error: error.message }
  revalidatePath('/app/community')
  return { ok: true }
}

export async function getCommunityComments(postId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('community_comments')
    .select('*, profile:profiles(name, avatar_color, membership_tier)')
    .eq('post_id', postId)
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: true })
  return data ?? []
}

export async function togglePinPost(postId: string) {
  const { supabase, user } = await requireUser()
  if (!(await isFounderOrAdmin(supabase, user.id))) return { error: 'Only the Founder can pin posts.' }
  const { data: post } = await supabase.from('community_posts').select('pinned').eq('id', postId).single()
  const { error } = await supabase.from('community_posts').update({ pinned: !post?.pinned }).eq('id', postId)
  if (error) return { error: error.message }
  revalidatePath('/app/community')
  return { ok: true }
}

export async function togglePinComment(commentId: string) {
  const { supabase, user } = await requireUser()
  if (!(await isFounderOrAdmin(supabase, user.id))) return { error: 'Only the Founder can pin comments.' }
  const { data: comment } = await supabase.from('community_comments').select('pinned').eq('id', commentId).single()
  const { error } = await supabase.from('community_comments').update({ pinned: !comment?.pinned }).eq('id', commentId)
  if (error) return { error: error.message }
  revalidatePath('/app/community')
  return { ok: true }
}

export async function togglePinCircleEntry(entryId: string) {
  const { supabase, user } = await requireUser()
  if (!(await isFounderOrAdmin(supabase, user.id))) return { error: 'Only the Founder can pin entries.' }
  const { data: entry } = await supabase.from('journal_entries').select('pinned').eq('id', entryId).single()
  const { error } = await supabase.from('journal_entries').update({ pinned: !entry?.pinned }).eq('id', entryId)
  if (error) return { error: error.message }
  revalidatePath('/app/circle')
  return { ok: true }
}

export async function togglePinCircleComment(commentId: string) {
  const { supabase, user } = await requireUser()
  if (!(await isFounderOrAdmin(supabase, user.id))) return { error: 'Only the Founder can pin comments.' }
  const { data: comment } = await supabase.from('comments').select('pinned').eq('id', commentId).single()
  const { error } = await supabase.from('comments').update({ pinned: !comment?.pinned }).eq('id', commentId)
  if (error) return { error: error.message }
  revalidatePath('/app/circle')
  return { ok: true }
}

// ============================================================
// WORKOUTS HUB (admin-managed content)
// ============================================================

export async function adminAddWorkout(input: {
  title: string
  description: string
  pillar: string
  bodyGroup?: string
  workoutType?: string
  videoUrl?: string
  instructions?: string
  imageUrl?: string
  pdfUrl?: string
  isPremium: boolean
}) {
  const { supabase } = await requireAdmin()
  const { error } = await supabase.from('workouts').insert({
    title: input.title.trim(),
    description: input.description.trim(),
    pillar: input.pillar,
    body_group: input.bodyGroup || 'any',
    workout_type: input.workoutType || 'any',
    video_url: input.videoUrl || null,
    instructions: input.instructions || null,
    image_url: input.imageUrl || null,
    pdf_url: input.pdfUrl || null,
    is_premium: input.isPremium,
  })
  if (error) return { error: error.message }
  revalidatePath('/app/workouts')
  revalidatePath('/admin/workouts')
  return { ok: true }
}

export async function adminUpdateWorkout(
  workoutId: string,
  input: {
    title: string
    description: string
    pillar: string
    bodyGroup?: string
    workoutType?: string
    videoUrl?: string
    instructions?: string
    imageUrl?: string
    pdfUrl?: string
    isPremium: boolean
  },
) {
  const { supabase } = await requireAdmin()
  const { error } = await supabase
    .from('workouts')
    .update({
      title: input.title.trim(),
      description: input.description.trim(),
      pillar: input.pillar,
      body_group: input.bodyGroup || 'any',
      workout_type: input.workoutType || 'any',
      video_url: input.videoUrl || null,
      instructions: input.instructions || null,
      image_url: input.imageUrl || null,
      pdf_url: input.pdfUrl || null,
      is_premium: input.isPremium,
    })
    .eq('id', workoutId)
  if (error) return { error: error.message }
  revalidatePath('/app/workouts')
  revalidatePath('/admin/workouts')
  return { ok: true }
}

export async function adminDeleteWorkout(workoutId: string) {
  const { supabase } = await requireAdmin()
  const { error } = await supabase.from('workouts').delete().eq('id', workoutId)
  if (error) return { error: error.message }
  revalidatePath('/app/workouts')
  revalidatePath('/admin/workouts')
  return { ok: true }
}

export async function adminAddMealPlan(input: { title: string; description: string; content?: string; fileUrl?: string; isPremium: boolean }) {
  const { supabase } = await requireAdmin()
  const { error } = await supabase.from('meal_plans').insert({
    title: input.title.trim(),
    description: input.description.trim(),
    content: input.content || null,
    file_url: input.fileUrl || null,
    is_premium: input.isPremium,
  })
  if (error) return { error: error.message }
  revalidatePath('/app/workouts')
  revalidatePath('/admin/workouts')
  return { ok: true }
}

export async function adminDeleteMealPlan(id: string) {
  const { supabase } = await requireAdmin()
  const { error } = await supabase.from('meal_plans').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/app/workouts')
  revalidatePath('/admin/workouts')
  return { ok: true }
}

export async function adminDeleteGroceryList(id: string) {
  const { supabase } = await requireAdmin()
  const { error } = await supabase.from('grocery_lists').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/app/workouts')
  revalidatePath('/admin/workouts')
  return { ok: true }
}

export async function adminAddGroceryList(input: { title: string; items: string; isPremium: boolean }) {
  const { supabase } = await requireAdmin()
  const { error } = await supabase.from('grocery_lists').insert({
    title: input.title.trim(),
    items: input.items.trim(),
    is_premium: input.isPremium,
  })
  if (error) return { error: error.message }
  revalidatePath('/app/workouts')
  revalidatePath('/admin/workouts')
  return { ok: true }
}

export async function saveCheckin(input: {
  energy?: number
  mood?: string
  stress?: number
  sleepQuality?: number
  hydrationOz?: number
  proteinG?: number
  sunlightMinutes?: number
  movementMinutes?: number
  cyclePhase?: string
  symptoms?: string[]
}) {
  const { supabase, user } = await requireUser()
  const today = new Date().toISOString().slice(0, 10)
  const { error } = await supabase.from('checkins').upsert(
    {
      user_id: user.id,
      date: today,
      energy: input.energy ?? null,
      mood: input.mood ?? null,
      stress: input.stress ?? null,
      sleep_quality: input.sleepQuality ?? null,
      hydration_oz: input.hydrationOz ?? null,
      protein_g: input.proteinG ?? null,
      sunlight_minutes: input.sunlightMinutes ?? null,
      movement_minutes: input.movementMinutes ?? null,
      cycle_phase: input.cyclePhase ?? null,
      symptoms: input.symptoms ?? [],
    },
    { onConflict: 'user_id,date' },
  )
  if (error) return { error: error.message }
  await bumpStreak(user.id)
  revalidatePath('/app')
  revalidatePath('/app/energy')
  return { ok: true }
}

export async function saveMorningReset(input: { intention: string; gratitude: string }) {
  const { supabase, user } = await requireUser()
  const today = new Date().toISOString().slice(0, 10)
  const { error } = await supabase
    .from('morning_resets')
    .upsert({ user_id: user.id, date: today, intention: input.intention.trim(), gratitude: input.gratitude.trim(), completed_at: new Date().toISOString() }, { onConflict: 'user_id,date' })
  if (error) return { error: error.message }
  await bumpStreak(user.id)
  revalidatePath('/app')
  return { ok: true }
}

export async function saveEveningReflection(input: { q1: string; q2: string; q3: string }) {
  const { supabase, user } = await requireUser()
  const today = new Date().toISOString().slice(0, 10)
  const { error } = await supabase
    .from('evening_reflections')
    .upsert({ user_id: user.id, date: today, q1: input.q1.trim(), q2: input.q2.trim(), q3: input.q3.trim() }, { onConflict: 'user_id,date' })
  if (error) return { error: error.message }
  await bumpStreak(user.id)
  revalidatePath('/app')
  return { ok: true }
}

export async function addWin(input: { text: string; kind?: string }) {
  const { supabase, user } = await requireUser()
  const text = input.text.trim()
  if (!text) return { error: 'Write something first.' }
  const { error } = await supabase.from('wins').insert({ user_id: user.id, text, kind: input.kind ?? 'win' })
  if (error) return { error: error.message }
  await bumpStreak(user.id)
  revalidatePath('/app')
  revalidatePath('/app/energy')
  return { ok: true }
}

// ============================================================
// PHASE 2: HABIT STACKING + PROTOCOLS
// ============================================================

export async function addHabit(input: { title: string; anchor?: string; pillar?: string }) {
  const { supabase, user } = await requireUser()
  const title = input.title.trim()
  if (!title) return { error: 'Give the habit a name first.' }
  const { error } = await supabase.from('habits').insert({
    user_id: user.id,
    title,
    anchor: input.anchor?.trim() || null,
    pillar: input.pillar || null,
  })
  if (error) return { error: error.message }
  revalidatePath('/app/energy')
  return { ok: true }
}

export async function archiveHabit(habitId: string) {
  const { supabase, user } = await requireUser()
  const { error } = await supabase.from('habits').update({ archived: true }).eq('id', habitId).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/app/energy')
  return { ok: true }
}

export async function toggleHabitLog(habitId: string) {
  const { supabase, user } = await requireUser()
  const today = new Date().toISOString().slice(0, 10)
  const { data: existing } = await supabase.from('habit_logs').select('id').eq('habit_id', habitId).eq('date', today).maybeSingle()
  if (existing) {
    const { error } = await supabase.from('habit_logs').delete().eq('id', existing.id)
    if (error) return { error: error.message }
    revalidatePath('/app/energy')
    return { ok: true, completed: false }
  }
  const { error } = await supabase.from('habit_logs').insert({ habit_id: habitId, user_id: user.id, date: today })
  if (error) return { error: error.message }
  await bumpStreak(user.id)
  revalidatePath('/app/energy')
  return { ok: true, completed: true }
}

export async function startProtocol(slug: string) {
  const { supabase, user } = await requireUser()
  // end any other active enrollment first — one protocol at a time keeps it focused
  await supabase.from('protocol_enrollments').update({ is_active: false, ended_at: new Date().toISOString() }).eq('user_id', user.id).eq('is_active', true)
  const { error } = await supabase.from('protocol_enrollments').insert({ user_id: user.id, protocol_slug: slug, is_active: true })
  if (error) return { error: error.message }
  revalidatePath('/app/protocols')
  return { ok: true }
}

export async function endProtocol(enrollmentId: string) {
  const { supabase, user } = await requireUser()
  const { error } = await supabase
    .from('protocol_enrollments')
    .update({ is_active: false, ended_at: new Date().toISOString() })
    .eq('id', enrollmentId)
    .eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/app/protocols')
  return { ok: true }
}

export async function completeProtocolDay(enrollmentId: string, dayNumber: number) {
  const { supabase, user } = await requireUser()
  const { data: existing } = await supabase
    .from('protocol_day_completions')
    .select('id')
    .eq('enrollment_id', enrollmentId)
    .eq('day_number', dayNumber)
    .maybeSingle()
  if (existing) {
    const { error } = await supabase.from('protocol_day_completions').delete().eq('id', existing.id)
    if (error) return { error: error.message }
    revalidatePath('/app/protocols')
    return { ok: true, completed: false }
  }
  const { error } = await supabase.from('protocol_day_completions').insert({ enrollment_id: enrollmentId, user_id: user.id, day_number: dayNumber })
  if (error) return { error: error.message }
  await bumpStreak(user.id)
  revalidatePath('/app/protocols')
  return { ok: true, completed: true }
}

// ============================================================
// PHASE 3: PANTRY + GROCERY BUILDER + RESOURCE VAULT
// ============================================================

export async function addPantryItem(input: { name: string; category?: string; quantity?: string }) {
  const { supabase, user } = await requireUser()
  const name = input.name.trim()
  if (!name) return { error: 'Name the item first.' }
  const { error } = await supabase.from('pantry_items').insert({
    user_id: user.id,
    name,
    category: input.category || 'other',
    quantity: input.quantity?.trim() || null,
  })
  if (error) return { error: error.message }
  revalidatePath('/app/pantry')
  return { ok: true }
}

export async function updatePantryItem(id: string, input: { name?: string; quantity?: string; category?: string }) {
  const { supabase, user } = await requireUser()
  const updates: Record<string, string | null> = {}
  // a blank name is ignored rather than written, so an accidental clear cannot wipe the row
  if (input.name?.trim()) updates.name = input.name.trim()
  if (input.quantity !== undefined) updates.quantity = input.quantity.trim() || null
  if (input.category !== undefined) updates.category = input.category
  const { error } = await supabase.from('pantry_items').update(updates).eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/app/pantry')
  return { ok: true }
}

export async function deletePantryItem(itemId: string) {
  const { supabase, user } = await requireUser()
  const { error } = await supabase.from('pantry_items').delete().eq('id', itemId).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/app/pantry')
  return { ok: true }
}

export async function toggleRunningLow(itemId: string) {
  const { supabase, user } = await requireUser()
  const { data: item } = await supabase.from('pantry_items').select('running_low').eq('id', itemId).eq('user_id', user.id).single()
  const { error } = await supabase.from('pantry_items').update({ running_low: !item?.running_low }).eq('id', itemId).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/app/pantry')
  return { ok: true }
}

export async function addGroceryBuilderItem(input: { name: string; category?: string; quantity?: string }) {
  const { supabase, user } = await requireUser()
  const name = input.name.trim()
  if (!name) return { error: 'Name the item first.' }
  const { error } = await supabase.from('grocery_builder_items').insert({
    user_id: user.id,
    name,
    category: input.category || 'other',
    quantity: input.quantity?.trim() || null,
  })
  if (error) return { error: error.message }
  revalidatePath('/app/pantry')
  return { ok: true }
}

export async function updateGroceryBuilderItem(id: string, input: { name?: string; quantity?: string }) {
  const { supabase, user } = await requireUser()
  const updates: Record<string, string | null> = {}
  // as above: never overwrite a name with an empty string
  if (input.name?.trim()) updates.name = input.name.trim()
  if (input.quantity !== undefined) updates.quantity = input.quantity.trim() || null
  const { error } = await supabase.from('grocery_builder_items').update(updates).eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/app/pantry')
  return { ok: true }
}

// ============================================================
// WILD HONEY CALENDAR
// ============================================================

export async function getDaySnapshot(dateISO: string) {
  const { supabase, user } = await requireUser()
  const dayStart = `${dateISO}T00:00:00.000Z`
  const dayEnd = `${dateISO}T23:59:59.999Z`

  const [{ data: checkin }, { data: entries }, { data: meals }, { data: habitLogs }] = await Promise.all([
    supabase.from('checkins').select('*').eq('user_id', user.id).eq('date', dateISO).maybeSingle(),
    supabase
      .from('journal_entries')
      .select('id, text, created_at, prompt:prompts(text, pillar)')
      .eq('user_id', user.id)
      .gte('created_at', dayStart)
      .lte('created_at', dayEnd),
    supabase.from('meal_logs').select('id, servings, recipe:recipes(title, calories, protein_g)').eq('user_id', user.id).eq('date', dateISO),
    supabase.from('habit_logs').select('id, habit:habits(title)').eq('user_id', user.id).eq('date', dateISO),
  ])

  return {
    checkin: checkin ?? null,
    entries: entries ?? [],
    meals: meals ?? [],
    habitLogs: habitLogs ?? [],
  }
}

export async function toggleGroceryItemChecked(itemId: string) {
  const { supabase, user } = await requireUser()
  const { data: item } = await supabase.from('grocery_builder_items').select('checked').eq('id', itemId).eq('user_id', user.id).single()
  const { error } = await supabase.from('grocery_builder_items').update({ checked: !item?.checked }).eq('id', itemId).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/app/pantry')
  return { ok: true }
}

export async function deleteGroceryBuilderItem(itemId: string) {
  const { supabase, user } = await requireUser()
  const { error } = await supabase.from('grocery_builder_items').delete().eq('id', itemId).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/app/pantry')
  return { ok: true }
}

export async function clearCheckedGroceryItems() {
  const { supabase, user } = await requireUser()
  const { error } = await supabase.from('grocery_builder_items').delete().eq('user_id', user.id).eq('checked', true)
  if (error) return { error: error.message }
  revalidatePath('/app/pantry')
  return { ok: true }
}

export async function importGroceryListToBuilder(groceryListId: string) {
  const { supabase, user } = await requireUser()
  const { data: list } = await supabase.from('grocery_lists').select('items').eq('id', groceryListId).single()
  if (!list?.items) return { error: 'That list has nothing to import.' }
  const lines = list.items
    .split('\n')
    .map((l: string) => l.trim())
    .filter((l: string) => l.length > 0)
  if (lines.length === 0) return { error: 'That list has nothing to import.' }
  const rows = lines.map((name: string) => ({ user_id: user.id, name, category: 'other' }))
  const { error } = await supabase.from('grocery_builder_items').insert(rows)
  if (error) return { error: error.message }
  revalidatePath('/app/pantry')
  return { ok: true, count: lines.length }
}

export async function importRecipeToGroceryList(recipeId: string) {
  const { supabase, user } = await requireUser()
  const { data: recipe } = await supabase.from('recipes').select('ingredients').eq('id', recipeId).single()
  if (!recipe?.ingredients) return { error: 'That recipe has no ingredients to import.' }
  const lines = recipe.ingredients
    .split('\n')
    .map((l: string) => l.trim())
    .filter((l: string) => l.length > 0)
  if (lines.length === 0) return { error: 'That recipe has no ingredients to import.' }
  const rows = lines.map((name: string) => ({ user_id: user.id, name, category: 'other' }))
  const { error } = await supabase.from('grocery_builder_items').insert(rows)
  if (error) return { error: error.message }
  revalidatePath('/app/pantry')
  return { ok: true, count: lines.length }
}

export async function toggleSavedResource(resourceId: string) {
  const { supabase, user } = await requireUser()
  const { data: existing } = await supabase.from('saved_resources').select('id').eq('resource_id', resourceId).eq('user_id', user.id).maybeSingle()
  if (existing) {
    const { error } = await supabase.from('saved_resources').delete().eq('id', existing.id)
    if (error) return { error: error.message }
    revalidatePath('/app/vault')
    return { ok: true, saved: false }
  }
  const { error } = await supabase.from('saved_resources').insert({ user_id: user.id, resource_id: resourceId })
  if (error) return { error: error.message }
  revalidatePath('/app/vault')
  return { ok: true, saved: true }
}

export async function adminAddResource(input: { title: string; description?: string; url?: string; imageUrl?: string; resourceType: string; pillar?: string }) {
  const { supabase } = await requireAdmin()
  const title = input.title.trim()
  if (!title) return { error: 'Give the resource a title first.' }
  const { error } = await supabase.from('resources').insert({
    title,
    description: input.description?.trim() || null,
    url: input.url?.trim() || null,
    image_url: input.imageUrl?.trim() || null,
    resource_type: input.resourceType || 'article',
    pillar: input.pillar || null,
  })
  if (error) return { error: error.message }
  revalidatePath('/app/vault')
  revalidatePath('/admin/resources')
  return { ok: true }
}

export async function adminUpdateResource(
  resourceId: string,
  input: { title: string; description?: string; url?: string; imageUrl?: string; resourceType: string; pillar?: string },
) {
  const { supabase } = await requireAdmin()
  const title = input.title.trim()
  if (!title) return { error: 'Give the resource a title first.' }
  const { error } = await supabase
    .from('resources')
    .update({
      title,
      description: input.description?.trim() || null,
      url: input.url?.trim() || null,
      image_url: input.imageUrl?.trim() || null,
      resource_type: input.resourceType || 'article',
      pillar: input.pillar || null,
    })
    .eq('id', resourceId)
  if (error) return { error: error.message }
  revalidatePath('/app/vault')
  revalidatePath('/admin/resources')
  return { ok: true }
}

export async function adminDeleteResource(resourceId: string) {
  const { supabase } = await requireAdmin()
  const { error } = await supabase.from('resources').delete().eq('id', resourceId)
  if (error) return { error: error.message }
  revalidatePath('/app/vault')
  revalidatePath('/admin/resources')
  return { ok: true }
}

// ============================================================
// PHASE 5: ONBOARDING + HONEY PROFILE
// ============================================================

export async function completeOnboarding(input: {
  name: string
  ageRange?: string
  season?: string
  goals: string[]
  vitality: Record<string, number>
  wakeTime?: string
  bedtime?: string
  movementPreference?: string
  hydrationGoalOz?: number
  caffeine?: string
  foodsAvoided?: string
  allergies?: string
  communicationStyle?: string
  faithPreference?: string
}) {
  const { supabase, user } = await requireUser()
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      name: input.name.trim() || undefined,
      age_range: input.ageRange || null,
      season: input.season || null,
      wake_time: input.wakeTime?.trim() || null,
      bedtime: input.bedtime?.trim() || null,
      movement_preference: input.movementPreference || null,
      hydration_goal_oz: input.hydrationGoalOz ?? null,
      caffeine: input.caffeine || null,
      foods_avoided: input.foodsAvoided?.trim() || null,
      allergies: input.allergies?.trim() || null,
      communication_style: input.communicationStyle || null,
      faith_preference: input.faithPreference || null,
      timezone,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq('id', user.id)
  if (profileError) return { error: profileError.message }

  if (input.goals.length > 0) {
    const rows = input.goals.map((goal) => ({ user_id: user.id, goal }))
    const { error: goalsError } = await supabase.from('user_goals').upsert(rows, { onConflict: 'user_id,goal' })
    if (goalsError) return { error: goalsError.message }
  }

  // Onboarding no longer asks for a baseline, so only write one if something
  // was actually rated. Otherwise this inserted a row of nulls that would have
  // counted as her "before" and made the week-8 comparison meaningless.
  const v = input.vitality
  const rated = Object.values(v).some((n) => typeof n === 'number' && n > 0)
  const { error: vitalityError } = !rated
    ? { error: null }
    : await supabase.from('vitality_checkins').insert({
    user_id: user.id,
    energy: v.energy ?? null,
    mood: v.mood ?? null,
    stress: v.stress ?? null,
    sleep: v.sleep ?? null,
    confidence: v.confidence ?? null,
    motivation: v.motivation ?? null,
    mental_clarity: v.mental_clarity ?? null,
    physical_strength: v.physical_strength ?? null,
        label: 'baseline',
      })
  if (vitalityError) return { error: vitalityError.message }

  revalidatePath('/app')
  revalidatePath('/app/profile')
  return { ok: true }
}

export async function skipOnboarding() {
  const { supabase, user } = await requireUser()
  const { error } = await supabase.from('profiles').update({ onboarding_completed_at: new Date().toISOString() }).eq('id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/app')
  return { ok: true }
}

export async function updateGoals(goals: string[]) {
  const { supabase, user } = await requireUser()
  const { error: delError } = await supabase.from('user_goals').delete().eq('user_id', user.id)
  if (delError) return { error: delError.message }
  if (goals.length > 0) {
    const rows = goals.map((goal) => ({ user_id: user.id, goal }))
    const { error } = await supabase.from('user_goals').insert(rows)
    if (error) return { error: error.message }
  }
  revalidatePath('/app/profile')
  return { ok: true }
}

export async function updateHoneyProfile(input: {
  season?: string
  faithPreference?: string
  communicationStyle?: string
  ageRange?: string
  wakeTime?: string
  bedtime?: string
  movementPreference?: string
  hydrationGoalOz?: number
  caffeine?: string
  foodsAvoided?: string
  allergies?: string
}) {
  const { supabase, user } = await requireUser()
  const { error } = await supabase
    .from('profiles')
    .update({
      season: input.season || null,
      faith_preference: input.faithPreference || null,
      communication_style: input.communicationStyle || null,
      age_range: input.ageRange || null,
      wake_time: input.wakeTime?.trim() || null,
      bedtime: input.bedtime?.trim() || null,
      movement_preference: input.movementPreference || null,
      hydration_goal_oz: input.hydrationGoalOz ?? null,
      caffeine: input.caffeine || null,
      foods_avoided: input.foodsAvoided?.trim() || null,
      allergies: input.allergies?.trim() || null,
    })
    .eq('id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/app/profile')
  revalidatePath('/app')
  return { ok: true }
}

export async function addVitalityCheckin(vitality: Record<string, number>, note?: string, label: 'baseline' | 'checkpoint' = 'checkpoint') {
  const { supabase, user } = await requireUser()
  const { error } = await supabase.from('vitality_checkins').insert({
    user_id: user.id,
    energy: vitality.energy ?? null,
    mood: vitality.mood ?? null,
    stress: vitality.stress ?? null,
    sleep: vitality.sleep ?? null,
    confidence: vitality.confidence ?? null,
    motivation: vitality.motivation ?? null,
    mental_clarity: vitality.mental_clarity ?? null,
    physical_strength: vitality.physical_strength ?? null,
    label,
    note: note?.trim() || null,
  })
  if (error) return { error: error.message }
  revalidatePath('/app/profile')
  return { ok: true }
}

// ============================================================
// PHASE 6: PROGRESS / TRANSFORMATION
// ============================================================

export async function saveReflection(input: {
  milestone: string
  qChanged?: string
  qProud?: string
  qDifferent?: string
  qBecoming?: string
}) {
  const { supabase, user } = await requireUser()
  const { error } = await supabase.from('transformation_reflections').insert({
    user_id: user.id,
    milestone: input.milestone,
    q_changed: input.qChanged?.trim() || null,
    q_proud: input.qProud?.trim() || null,
    q_different: input.qDifferent?.trim() || null,
    q_becoming: input.qBecoming?.trim() || null,
  })
  if (error) return { error: error.message }
  revalidatePath('/app/progress')
  return { ok: true }
}

// ============================================================
// PHASE 4: PRIVATE GROUPS + RETREAT INTEGRATION + ASK AN EXPERT
// ============================================================

function randomInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no ambiguous chars
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export async function createGroup(input: { name: string; description?: string; pillar?: string }) {
  const { supabase, user } = await requireUser()
  const name = input.name.trim()
  if (!name) return { error: 'Give the group a name first.' }
  const inviteCode = randomInviteCode()
  const { data: group, error } = await supabase
    .from('groups')
    .insert({ name, description: input.description?.trim() || null, pillar: input.pillar || null, invite_code: inviteCode, created_by: user.id })
    .select('id')
    .single()
  if (error) return { error: error.message }
  const { error: memberError } = await supabase.from('group_members').insert({ group_id: group.id, user_id: user.id, role: 'owner' })
  if (memberError) return { error: memberError.message }
  revalidatePath('/app/groups')
  return { ok: true, groupId: group.id as string }
}

export async function joinGroupByCode(code: string) {
  const { supabase, user } = await requireUser()
  const trimmed = code.trim().toUpperCase()
  if (!trimmed) return { error: 'Enter an invite code first.' }
  const { data: group } = await supabase.from('groups').select('id').eq('invite_code', trimmed).maybeSingle()
  if (!group) return { error: "That code doesn't match a group." }
  const { error } = await supabase.from('group_members').insert({ group_id: group.id, user_id: user.id, role: 'member' })
  if (error) {
    if (error.code === '23505') return { error: "You're already in that group." }
    return { error: error.message }
  }
  revalidatePath('/app/groups')
  return { ok: true, groupId: group.id as string }
}

export async function leaveGroup(groupId: string) {
  const { supabase, user } = await requireUser()
  const { error } = await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/app/groups')
  return { ok: true }
}

export async function createGroupPost(groupId: string, text: string) {
  const { supabase, user } = await requireUser()
  const trimmed = text.trim()
  if (!trimmed) return { error: 'Write something first.' }
  const { error } = await supabase.from('group_posts').insert({ group_id: groupId, user_id: user.id, text: trimmed })
  if (error) return { error: error.message }
  revalidatePath(`/app/groups/${groupId}`)
  return { ok: true }
}

export async function toggleGroupPostReaction(postId: string) {
  const { supabase, user } = await requireUser()
  const { data: existing } = await supabase.from('group_post_reactions').select('id').eq('post_id', postId).eq('user_id', user.id).maybeSingle()
  if (existing) {
    await supabase.from('group_post_reactions').delete().eq('id', existing.id)
  } else {
    const { error } = await supabase.from('group_post_reactions').insert({ post_id: postId, user_id: user.id })
    if (error) return { error: error.message }
  }
  return { ok: true, reacted: !existing }
}

export async function addGroupPostComment(postId: string, text: string) {
  const { supabase, user } = await requireUser()
  const trimmed = text.trim()
  if (!trimmed) return { error: 'Comment cannot be empty.' }
  const { error } = await supabase.from('group_post_comments').insert({ post_id: postId, user_id: user.id, text: trimmed })
  if (error) return { error: error.message }
  return { ok: true }
}

export async function getGroupPostComments(postId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('group_post_comments')
    .select('*, profile:profiles(name, avatar_color)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
  return data ?? []
}

export async function adminCreateGroupForRetreat(retreatId: string) {
  const { supabase, user } = await requireAdmin()
  const { data: retreat } = await supabase.from('retreats').select('title, group_id').eq('id', retreatId).single()
  if (!retreat) return { error: 'Retreat not found.' }
  if (retreat.group_id) return { error: 'This retreat already has an attendee group.' }

  const inviteCode = randomInviteCode()
  const { data: group, error } = await supabase
    .from('groups')
    .insert({ name: `${retreat.title} — Attendees`, retreat_id: retreatId, invite_code: inviteCode, created_by: user.id })
    .select('id')
    .single()
  if (error) return { error: error.message }

  await supabase.from('group_members').insert({ group_id: group.id, user_id: user.id, role: 'owner' })

  const { data: signups } = await supabase.from('retreat_signups').select('user_id').eq('retreat_id', retreatId).eq('status', 'confirmed')
  const rows = (signups ?? []).filter((s) => s.user_id !== user.id).map((s) => ({ group_id: group.id, user_id: s.user_id, role: 'member' as const }))
  if (rows.length > 0) await supabase.from('group_members').insert(rows)

  const { error: linkError } = await supabase.from('retreats').update({ group_id: group.id }).eq('id', retreatId)
  if (linkError) return { error: linkError.message }

  revalidatePath('/app/retreats')
  revalidatePath('/admin/retreats')
  return { ok: true, groupId: group.id as string, memberCount: rows.length + 1 }
}

export async function submitExpertQuestion(input: { question: string; pillar?: string }) {
  const { supabase, user } = await requireUser()
  const question = input.question.trim()
  if (!question) return { error: 'Write your question first.' }
  const { error } = await supabase.from('expert_questions').insert({ user_id: user.id, question, pillar: input.pillar || null })
  if (error) return { error: error.message }
  revalidatePath('/app/ask')
  return { ok: true }
}

export async function adminAnswerQuestion(questionId: string, answer: string) {
  const { supabase } = await requireAdmin()
  const trimmed = answer.trim()
  if (!trimmed) return { error: 'Write an answer first.' }
  const { error } = await supabase.from('expert_questions').update({ answer: trimmed, answered_at: new Date().toISOString() }).eq('id', questionId)
  if (error) return { error: error.message }
  revalidatePath('/app/ask')
  revalidatePath('/admin/questions')
  return { ok: true }
}

export async function adminToggleQuestionPublic(questionId: string) {
  const { supabase } = await requireAdmin()
  const { data: q } = await supabase.from('expert_questions').select('is_public').eq('id', questionId).single()
  const { error } = await supabase.from('expert_questions').update({ is_public: !q?.is_public }).eq('id', questionId)
  if (error) return { error: error.message }
  revalidatePath('/app/ask')
  revalidatePath('/admin/questions')
  return { ok: true }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/auth/login')
}

// ============================================================
// ADMIN ACTIONS — every function below re-checks is_admin itself,
// never trust the UI alone to gate these.
// ============================================================

async function requireAdmin() {
  const { supabase, user } = await requireUser()
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) throw new Error('Not authorized')
  return { supabase, user }
}

export async function adminAddPrompt(input: {
  pillar: string
  text: string
  dateScheduled: string
  isPremium: boolean
}) {
  const { supabase } = await requireAdmin()
  const { error } = await supabase.from('prompts').insert({
    pillar: input.pillar,
    text: input.text.trim(),
    date_scheduled: input.dateScheduled,
    is_premium: input.isPremium,
  })
  if (error) return { error: error.message }
  revalidatePath('/admin/prompts')
  revalidatePath('/app')
  revalidatePath('/app/archive')
  return { ok: true }
}

export async function adminDeletePrompt(id: string) {
  const { supabase } = await requireAdmin()
  const { error } = await supabase.from('prompts').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/prompts')
  revalidatePath('/app/archive')
  return { ok: true }
}

export async function adminAddProduct(input: {
  title: string
  description: string
  priceCents: number
  coverImage?: string
  fileUrl?: string
}) {
  const { supabase } = await requireAdmin()
  const { error } = await supabase.from('products').insert({
    title: input.title.trim(),
    description: input.description.trim(),
    price_cents: input.priceCents,
    cover_image: input.coverImage || null,
    file_url: input.fileUrl || null,
    is_published: true,
  })
  if (error) return { error: error.message }
  revalidatePath('/admin/products')
  revalidatePath('/app/shop')
  return { ok: true }
}

export async function adminUpdateProduct(
  productId: string,
  input: {
    title: string
    description: string
    priceCents: number
    coverImage?: string
    fileUrl?: string
    isPublished: boolean
  },
) {
  const { supabase } = await requireAdmin()
  const { error } = await supabase
    .from('products')
    .update({
      title: input.title.trim(),
      description: input.description.trim(),
      price_cents: input.priceCents,
      cover_image: input.coverImage || null,
      file_url: input.fileUrl || null,
      is_published: input.isPublished,
    })
    .eq('id', productId)
  if (error) return { error: error.message }
  revalidatePath('/admin/products')
  revalidatePath('/app/shop')
  return { ok: true }
}

export async function adminDeleteProduct(productId: string) {
  const { supabase } = await requireAdmin()
  const { error } = await supabase.from('products').delete().eq('id', productId)
  if (error) return { error: error.message }
  revalidatePath('/admin/products')
  revalidatePath('/app/shop')
  return { ok: true }
}

export async function adminTogglePublished(id: string, isPublished: boolean) {
  const { supabase } = await requireAdmin()
  const { error } = await supabase.from('products').update({ is_published: isPublished }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/products')
  revalidatePath('/app/shop')
  return { ok: true }
}

export async function adminAddRetreat(input: {
  title: string
  location: string
  dates: string
  description: string
  priceCents: number
  spotsTotal: number
  coverImage?: string
}) {
  const { supabase } = await requireAdmin()
  const { error } = await supabase.from('retreats').insert({
    title: input.title.trim(),
    location: input.location.trim(),
    dates: input.dates.trim(),
    description: input.description.trim(),
    price_cents: input.priceCents,
    spots_total: input.spotsTotal,
    cover_image: input.coverImage || null,
  })
  if (error) return { error: error.message }
  revalidatePath('/admin/retreats')
  revalidatePath('/app/retreats')

  // Notify members who want retreat announcements — best-effort, never blocks the response.
  if (oneSignalConfigured()) {
    const { data: profiles } = await supabase.from('profiles').select('id, notification_prefs')
    const interestedIds = (profiles ?? [])
      .filter((p) => (p.notification_prefs as Record<string, boolean> | null)?.retreat_announcements !== false)
      .map((p) => p.id)
    sendPushToUsers({
      externalUserIds: interestedIds,
      title: 'New retreat announced',
      message: input.title.trim(),
      url: '/app/retreats',
    }).catch(() => {})
  }

  return { ok: true }
}

export async function adminUpdateRetreat(
  retreatId: string,
  input: {
    title: string
    location: string
    dates: string
    description: string
    priceCents: number
    spotsTotal: number
    coverImage?: string
  },
) {
  const { supabase } = await requireAdmin()
  const { error } = await supabase
    .from('retreats')
    .update({
      title: input.title.trim(),
      location: input.location.trim(),
      dates: input.dates.trim(),
      description: input.description.trim(),
      price_cents: input.priceCents,
      spots_total: input.spotsTotal,
      cover_image: input.coverImage || null,
    })
    .eq('id', retreatId)
  if (error) return { error: error.message }
  revalidatePath('/admin/retreats')
  revalidatePath('/app/retreats')
  return { ok: true }
}

export async function adminDeleteRetreat(retreatId: string) {
  const { supabase } = await requireAdmin()
  const { error } = await supabase.from('retreats').delete().eq('id', retreatId)
  if (error) return { error: error.message }
  revalidatePath('/admin/retreats')
  revalidatePath('/app/retreats')
  return { ok: true }
}

export async function adminGetMetrics() {
  const { supabase } = await requireAdmin()
  const [{ count: totalMembers }, { data: profiles }, { data: purchases }, { data: entries }] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('membership_tier'),
    supabase.from('purchases').select('id'),
    supabase.from('journal_entries').select('id, created_at').gte(
      'created_at',
      new Date(Date.now() - 7 * 86400000).toISOString(),
    ),
  ])
  const byTier = { free: 0, circle: 0, 'inner-circle': 0, founder: 0 } as Record<string, number>
  ;(profiles ?? []).forEach((p) => {
    byTier[p.membership_tier] = (byTier[p.membership_tier] ?? 0) + 1
  })
  return {
    totalMembers: totalMembers ?? 0,
    byTier,
    totalPurchases: purchases?.length ?? 0,
    entriesThisWeek: entries?.length ?? 0,
  }
}

// ============================================================
// PHASE 7: PRIVACY & ACCOUNT CONTROLS + ADMIN MEMBER MANAGEMENT
// ============================================================

export async function updateNotificationPrefs(input: {
  prefs: NotificationPrefs
  quietHoursStart?: string
  quietHoursEnd?: string
}) {
  const { supabase, user } = await requireUser()
  const { error } = await supabase
    .from('profiles')
    .update({
      notification_prefs: input.prefs,
      quiet_hours_start: input.quietHoursStart?.trim() || null,
      quiet_hours_end: input.quietHoursEnd?.trim() || null,
    })
    .eq('id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/app/settings')
  return { ok: true }
}

export async function recordDataConsent() {
  const { supabase, user } = await requireUser()
  const { error } = await supabase.from('profiles').update({ data_consent_at: new Date().toISOString() }).eq('id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/app/settings')
  return { ok: true }
}

export async function deleteMyAccount() {
  const { user } = await requireUser()
  const service = createServiceClient()
  // Deleting the auth user cascades to `profiles` (and everything that
  // references it) because profiles.id references auth.users.id on delete cascade.
  const { error } = await service.auth.admin.deleteUser(user.id)
  if (error) return { error: error.message }
  return { ok: true }
}

async function requireAdminForMembers() {
  return requireAdmin()
}

export async function adminGetMembers() {
  const { supabase } = await requireAdminForMembers()
  const [{ data: profiles }, { data: signups }] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    supabase.from('retreat_signups').select('user_id, status'),
  ])
  const signupCounts = new Map<string, number>()
  ;(signups ?? []).forEach((s) => {
    if (s.status === 'confirmed') signupCounts.set(s.user_id, (signupCounts.get(s.user_id) ?? 0) + 1)
  })
  return (profiles ?? []).map((p) => ({ ...p, confirmed_retreats: signupCounts.get(p.id) ?? 0 }))
}

export async function adminUpdateMemberTier(userId: string, tier: string) {
  const { supabase } = await requireAdmin()
  const { error } = await supabase.from('profiles').update({ membership_tier: tier }).eq('id', userId)
  if (error) return { error: error.message }
  revalidatePath('/admin/members')
  return { ok: true }
}

export async function adminToggleAdminStatus(userId: string, makeAdmin: boolean) {
  const { supabase } = await requireAdmin()
  const { error } = await supabase.from('profiles').update({ is_admin: makeAdmin }).eq('id', userId)
  if (error) return { error: error.message }
  revalidatePath('/admin/members')
  return { ok: true }
}

// ============================================================
// PHASE 8: COMMUNITY SAFETY
// ============================================================

export async function toggleBlockUser(userId: string) {
  const { supabase, user } = await requireUser()
  if (userId === user.id) return { error: "You can't block yourself." }
  const { data: existing } = await supabase.from('user_blocks').select('id').eq('blocker_id', user.id).eq('blocked_id', userId).maybeSingle()
  if (existing) {
    const { error } = await supabase.from('user_blocks').delete().eq('id', existing.id)
    if (error) return { error: error.message }
    return { ok: true, blocked: false }
  }
  const { error } = await supabase.from('user_blocks').insert({ blocker_id: user.id, blocked_id: userId })
  if (error) return { error: error.message }
  revalidatePath('/app/circle')
  revalidatePath('/app/community')
  return { ok: true, blocked: true }
}

export async function toggleMuteUser(userId: string) {
  const { supabase, user } = await requireUser()
  if (userId === user.id) return { error: "You can't mute yourself." }
  const { data: existing } = await supabase.from('user_mutes').select('id').eq('muter_id', user.id).eq('muted_id', userId).maybeSingle()
  if (existing) {
    const { error } = await supabase.from('user_mutes').delete().eq('id', existing.id)
    if (error) return { error: error.message }
    return { ok: true, muted: false }
  }
  const { error } = await supabase.from('user_mutes').insert({ muter_id: user.id, muted_id: userId })
  if (error) return { error: error.message }
  revalidatePath('/app/circle')
  revalidatePath('/app/community')
  return { ok: true, muted: true }
}

export async function unblockUser(blockId: string) {
  const { supabase, user } = await requireUser()
  const { error } = await supabase.from('user_blocks').delete().eq('id', blockId).eq('blocker_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/app/settings')
  return { ok: true }
}

export async function unmuteUser(muteId: string) {
  const { supabase, user } = await requireUser()
  const { error } = await supabase.from('user_mutes').delete().eq('id', muteId).eq('muter_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/app/settings')
  return { ok: true }
}

export async function reportContent(input: { contentType: string; contentId: string; reason: string }) {
  const { supabase, user } = await requireUser()
  const reason = input.reason.trim()
  if (!reason) return { error: 'Tell us what the issue is.' }
  const { error } = await supabase.from('content_reports').insert({
    reporter_id: user.id,
    content_type: input.contentType,
    content_id: input.contentId,
    reason,
  })
  if (error) return { error: error.message }
  return { ok: true }
}

const CONTENT_TABLE: Record<string, string> = {
  journal_entry: 'journal_entries',
  community_post: 'community_posts',
  community_comment: 'community_comments',
  group_post: 'group_posts',
  group_post_comment: 'group_post_comments',
  circle_comment: 'comments',
}

export async function adminReviewReport(reportId: string, status: 'reviewed' | 'dismissed') {
  const { supabase, user } = await requireAdmin()
  const { error } = await supabase.from('content_reports').update({ status, reviewed_at: new Date().toISOString(), reviewed_by: user.id }).eq('id', reportId)
  if (error) return { error: error.message }
  revalidatePath('/admin/reports')
  return { ok: true }
}

export async function adminRemoveReportedContent(reportId: string) {
  const { supabase, user } = await requireAdmin()
  const { data: report } = await supabase.from('content_reports').select('content_type, content_id').eq('id', reportId).single()
  if (!report) return { error: 'Report not found.' }
  const table = CONTENT_TABLE[report.content_type]
  if (!table) return { error: 'Unknown content type.' }
  await supabase.from(table).delete().eq('id', report.content_id)
  const { error } = await supabase.from('content_reports').update({ status: 'removed', reviewed_at: new Date().toISOString(), reviewed_by: user.id }).eq('id', reportId)
  if (error) return { error: error.message }
  revalidatePath('/admin/reports')
  revalidatePath('/app/circle')
  revalidatePath('/app/community')
  return { ok: true }
}

// ============================================================
// PHASE 10: RECIPES + CHALLENGES
// ============================================================

export async function toggleSavedRecipe(recipeId: string) {
  const { supabase, user } = await requireUser()
  const { data: existing } = await supabase.from('saved_recipes').select('id').eq('recipe_id', recipeId).eq('user_id', user.id).maybeSingle()
  if (existing) {
    const { error } = await supabase.from('saved_recipes').delete().eq('id', existing.id)
    if (error) return { error: error.message }
    revalidatePath('/app/recipes')
    return { ok: true, saved: false }
  }
  const { error } = await supabase.from('saved_recipes').insert({ user_id: user.id, recipe_id: recipeId })
  if (error) return { error: error.message }
  revalidatePath('/app/recipes')
  return { ok: true, saved: true }
}

export async function adminAddRecipe(input: {
  title: string
  description?: string
  ingredients: string
  instructions: string
  pillar?: string
  prepMinutes?: number
  imageUrl?: string
  videoUrl?: string
  isPremium: boolean
  season?: string
  cyclePhase?: string
  budgetTier?: string
  mealType?: string
  kidFriendly?: boolean
  proteinG?: number
  nutritionHighlights?: string
}) {
  const { supabase } = await requireAdmin()
  const title = input.title.trim()
  if (!title) return { error: 'Give the recipe a title first.' }
  const { error } = await supabase.from('recipes').insert({
    title,
    description: input.description?.trim() || null,
    ingredients: input.ingredients.trim(),
    instructions: input.instructions.trim(),
    pillar: input.pillar || null,
    prep_minutes: input.prepMinutes ?? null,
    image_url: input.imageUrl || null,
    video_url: input.videoUrl || null,
    is_premium: input.isPremium,
    season: input.season || 'any',
    cycle_phase: input.cyclePhase || 'any',
    budget_tier: input.budgetTier || 'moderate',
    meal_type: input.mealType || 'any',
    kid_friendly: input.kidFriendly ?? false,
    protein_g: input.proteinG ?? null,
    nutrition_highlights: input.nutritionHighlights?.trim() || null,
  })
  if (error) return { error: error.message }
  revalidatePath('/app/recipes')
  revalidatePath('/admin/recipes')
  return { ok: true }
}

export async function adminUpdateRecipe(
  recipeId: string,
  input: {
    title: string
    description?: string
    ingredients: string
    instructions: string
    pillar?: string
    prepMinutes?: number
    imageUrl?: string
    videoUrl?: string
    isPremium: boolean
    season?: string
    cyclePhase?: string
    budgetTier?: string
    mealType?: string
    kidFriendly?: boolean
    proteinG?: number
    calories?: number
    carbsG?: number
    fatG?: number
    nutritionHighlights?: string
  },
) {
  const { supabase } = await requireAdmin()
  const title = input.title.trim()
  if (!title) return { error: 'Give the recipe a title first.' }
  const { error } = await supabase
    .from('recipes')
    .update({
      title,
      description: input.description?.trim() || null,
      ingredients: input.ingredients.trim(),
      instructions: input.instructions.trim(),
      pillar: input.pillar || null,
      prep_minutes: input.prepMinutes ?? null,
      image_url: input.imageUrl || null,
      video_url: input.videoUrl || null,
      is_premium: input.isPremium,
      season: input.season || 'any',
      cycle_phase: input.cyclePhase || 'any',
      budget_tier: input.budgetTier || 'moderate',
      meal_type: input.mealType || 'any',
      kid_friendly: input.kidFriendly ?? false,
      protein_g: input.proteinG ?? null,
      calories: input.calories ?? null,
      carbs_g: input.carbsG ?? null,
      fat_g: input.fatG ?? null,
      nutrition_highlights: input.nutritionHighlights?.trim() || null,
    })
    .eq('id', recipeId)
  if (error) return { error: error.message }
  revalidatePath('/app/recipes')
  revalidatePath('/admin/recipes')
  return { ok: true }
}

export async function adminDeleteRecipe(recipeId: string) {
  const { supabase } = await requireAdmin()
  const { error } = await supabase.from('recipes').delete().eq('id', recipeId)
  if (error) return { error: error.message }
  revalidatePath('/app/recipes')
  revalidatePath('/admin/recipes')
  return { ok: true }
}

export async function joinChallenge(challengeId: string) {
  const { supabase, user } = await requireUser()
  const { error } = await supabase.from('challenge_participants').insert({ challenge_id: challengeId, user_id: user.id })
  if (error) {
    if (error.code === '23505') return { error: "You're already in this challenge." }
    return { error: error.message }
  }
  revalidatePath('/app/challenges')
  revalidatePath('/app')
  return { ok: true }
}

export async function leaveChallenge(challengeId: string) {
  const { supabase, user } = await requireUser()
  const { error } = await supabase.from('challenge_participants').delete().eq('challenge_id', challengeId).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/app/challenges')
  revalidatePath('/app')
  return { ok: true }
}

export async function checkInChallenge(challengeId: string) {
  const { supabase, user } = await requireUser()
  const today = new Date().toISOString().slice(0, 10)
  const { data: existing } = await supabase.from('challenge_checkins').select('id').eq('challenge_id', challengeId).eq('user_id', user.id).eq('date', today).maybeSingle()
  if (existing) {
    const { error } = await supabase.from('challenge_checkins').delete().eq('id', existing.id)
    if (error) return { error: error.message }
    revalidatePath('/app/challenges')
    revalidatePath('/app')
    return { ok: true, completed: false }
  }
  const { error } = await supabase.from('challenge_checkins').insert({ challenge_id: challengeId, user_id: user.id, date: today })
  if (error) return { error: error.message }
  await bumpStreak(user.id)
  revalidatePath('/app/challenges')
  revalidatePath('/app')
  return { ok: true, completed: true }
}

export async function adminAddChallenge(input: { title: string; description?: string; pillar?: string; lengthDays: number }) {
  const { supabase } = await requireAdmin()
  const title = input.title.trim()
  if (!title) return { error: 'Give the challenge a title first.' }
  const { error } = await supabase.from('challenges').insert({
    title,
    description: input.description?.trim() || null,
    pillar: input.pillar || null,
    length_days: input.lengthDays,
  })
  if (error) return { error: error.message }
  revalidatePath('/app/challenges')
  revalidatePath('/admin/challenges')
  return { ok: true }
}

export async function adminToggleChallengeActive(challengeId: string, isActive: boolean) {
  const { supabase } = await requireAdmin()
  const { error } = await supabase.from('challenges').update({ is_active: isActive }).eq('id', challengeId)
  if (error) return { error: error.message }
  revalidatePath('/app/challenges')
  revalidatePath('/admin/challenges')
  return { ok: true }
}

export async function adminDeleteChallenge(challengeId: string) {
  const { supabase } = await requireAdmin()
  const { error } = await supabase.from('challenges').delete().eq('id', challengeId)
  if (error) return { error: error.message }
  revalidatePath('/app/challenges')
  revalidatePath('/admin/challenges')
  return { ok: true }
}

// ============================================================
// NUTRITION TRACKING
// ============================================================

export async function logMeal(recipeId: string, servings: number = 1) {
  const { supabase, user } = await requireUser()
  const today = new Date().toISOString().slice(0, 10)
  const { error } = await supabase.from('meal_logs').insert({ user_id: user.id, recipe_id: recipeId, servings, date: today })
  if (error) return { error: error.message }
  revalidatePath('/app/recipes')
  return { ok: true }
}

export async function removeMealLog(logId: string) {
  const { supabase, user } = await requireUser()
  const { error } = await supabase.from('meal_logs').delete().eq('id', logId).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/app/recipes')
  return { ok: true }
}

export async function updateNutritionGoals(calorieGoal?: number, proteinGoal?: number) {
  const { supabase, user } = await requireUser()
  const { error } = await supabase
    .from('profiles')
    .update({ daily_calorie_goal: calorieGoal ?? null, daily_protein_goal_g: proteinGoal ?? null })
    .eq('id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/app/recipes')
  return { ok: true }
}

// ============================================================
// COMMITMENTS
// ============================================================

export async function addCommitment(text: string) {
  const { supabase, user } = await requireUser()
  const trimmed = text.trim()
  if (!trimmed) return { error: 'Write your commitment first.' }
  const { error } = await supabase.from('commitments').insert({ user_id: user.id, text: trimmed })
  if (error) return { error: error.message }
  revalidatePath('/app/calendar')
  return { ok: true }
}

/**
 * Handles the periodic "are you still committed to this?" check-in.
 * Never guilt-based — releasing or replacing is just as valid an answer
 * as continuing.
 */
export async function reviewCommitment(id: string, action: 'continue' | 'modify' | 'release' | 'replace', newText?: string) {
  const { supabase, user } = await requireUser()

  if (action === 'continue') {
    const { error } = await supabase.from('commitments').update({ last_reviewed_at: new Date().toISOString() }).eq('id', id).eq('user_id', user.id)
    if (error) return { error: error.message }
  } else if (action === 'modify') {
    if (!newText?.trim()) return { error: 'Add the updated wording first.' }
    const { error } = await supabase
      .from('commitments')
      .update({ text: newText.trim(), last_reviewed_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
    if (error) return { error: error.message }
  } else if (action === 'release') {
    const { error } = await supabase.from('commitments').update({ status: 'released', last_reviewed_at: new Date().toISOString() }).eq('id', id).eq('user_id', user.id)
    if (error) return { error: error.message }
  } else if (action === 'replace') {
    if (!newText?.trim()) return { error: 'Write the new commitment first.' }
    const { data: newRow, error: insertError } = await supabase
      .from('commitments')
      .insert({ user_id: user.id, text: newText.trim() })
      .select('id')
      .single()
    if (insertError) return { error: insertError.message }
    const { error } = await supabase
      .from('commitments')
      .update({ status: 'replaced', replaced_by_id: newRow.id, last_reviewed_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
    if (error) return { error: error.message }
  }

  revalidatePath('/app/calendar')
  return { ok: true }
}

export async function deleteCommitment(id: string) {
  const { supabase, user } = await requireUser()
  const { error } = await supabase.from('commitments').delete().eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/app/calendar')
  return { ok: true }
}

// ============================================================
// PERSONAL EXPERIMENTS
// ============================================================

export async function startExperiment(input: { title: string; description?: string; lengthDays: number }) {
  const { supabase, user } = await requireUser()
  const title = input.title.trim()
  if (!title) return { error: 'Name your experiment first.' }
  const { error } = await supabase.from('personal_experiments').insert({
    user_id: user.id,
    title,
    description: input.description?.trim() || null,
    length_days: input.lengthDays,
    start_date: new Date().toISOString().slice(0, 10),
  })
  if (error) return { error: error.message }
  revalidatePath('/app/calendar')
  return { ok: true }
}

export async function checkInExperimentDay(experimentId: string) {
  const { supabase, user } = await requireUser()
  const today = new Date().toISOString().slice(0, 10)
  const { data: existing } = await supabase
    .from('experiment_checkins')
    .select('id')
    .eq('experiment_id', experimentId)
    .eq('user_id', user.id)
    .eq('date', today)
    .maybeSingle()
  if (existing) return { ok: true, alreadyLogged: true }
  const { error } = await supabase.from('experiment_checkins').insert({ experiment_id: experimentId, user_id: user.id, date: today })
  if (error) return { error: error.message }
  revalidatePath('/app/calendar')
  return { ok: true }
}

/** Records the honest answer to "did this actually help you?" — never auto-declared from completion alone. */
export async function reflectOnExperiment(experimentId: string, helped: 'yes' | 'somewhat' | 'no', reflectionText?: string) {
  const { supabase, user } = await requireUser()
  const { error } = await supabase
    .from('personal_experiments')
    .update({
      status: 'completed',
      helped,
      reflection_text: reflectionText?.trim() || null,
      reflected_at: new Date().toISOString(),
    })
    .eq('id', experimentId)
    .eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/app/calendar')
  return { ok: true }
}

export async function abandonExperiment(experimentId: string) {
  const { supabase, user } = await requireUser()
  const { error } = await supabase.from('personal_experiments').update({ status: 'abandoned' }).eq('id', experimentId).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/app/calendar')
  return { ok: true }
}

export async function deleteExperiment(experimentId: string) {
  const { supabase, user } = await requireUser()
  const { error } = await supabase.from('personal_experiments').delete().eq('id', experimentId).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/app/calendar')
  return { ok: true }
}

// ============================================================
// YEAR DAY REFLECTION RITUAL
// ============================================================

export async function saveYearDayReflection(input: {
  wildHoneyYear: number
  qLearned?: string
  qChanged?: string
  qProud?: string
  qOvercame?: string
  qPatterns?: string
  qRelease?: string
  qCarryingForward?: string
  qBecoming?: string
  qIntention?: string
}) {
  const { supabase, user } = await requireUser()
  const { error } = await supabase.from('transformation_reflections').insert({
    user_id: user.id,
    milestone: 'year_day',
    wild_honey_year: input.wildHoneyYear,
    q_learned: input.qLearned?.trim() || null,
    q_changed: input.qChanged?.trim() || null,
    q_proud: input.qProud?.trim() || null,
    q_overcame: input.qOvercame?.trim() || null,
    q_patterns: input.qPatterns?.trim() || null,
    q_release: input.qRelease?.trim() || null,
    q_carrying_forward: input.qCarryingForward?.trim() || null,
    q_becoming: input.qBecoming?.trim() || null,
    q_intention: input.qIntention?.trim() || null,
  })
  if (error) return { error: error.message }
  revalidatePath('/app/calendar')
  revalidatePath('/app/progress')
  return { ok: true }
}

export async function getYearDayReflectionForYear(wildHoneyYear: number) {
  const { supabase, user } = await requireUser()
  const { data } = await supabase
    .from('transformation_reflections')
    .select('*')
    .eq('user_id', user.id)
    .eq('milestone', 'year_day')
    .eq('wild_honey_year', wildHoneyYear)
    .maybeSingle()
  return data ?? null
}

export async function updateSeason(season: string) {
  const { supabase, user } = await requireUser()
  const { error } = await supabase.from('profiles').update({ season }).eq('id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/app/calendar')
  revalidatePath('/app')
  return { ok: true }
}

// ============================================================
// RESET EXPERIENCE
// ============================================================

export async function saveResetReflection(input: {
  whatHappened?: string
  needToday?: string
  nextStep?: string
  carryingForward?: string
}) {
  const { supabase, user } = await requireUser()
  const { error } = await supabase.from('transformation_reflections').insert({
    user_id: user.id,
    milestone: 'reset',
    q_changed: input.whatHappened?.trim() || null,
    q_need_today: input.needToday?.trim() || null,
    q_next_step: input.nextStep?.trim() || null,
    q_carrying_forward: input.carryingForward?.trim() || null,
  })
  if (error) return { error: error.message }
  revalidatePath('/app')
  revalidatePath('/app/progress')
  return { ok: true }
}

/** Factual gap count — how many days since her last check-in. Not a pattern, just counting. */
export async function getCheckinGap() {
  const { supabase, user } = await requireUser()
  const { data } = await supabase.from('checkins').select('date').eq('user_id', user.id).order('date', { ascending: false }).limit(1).maybeSingle()
  if (!data) return { daysSinceLastCheckin: null }
  const last = new Date(data.date + 'T00:00:00')
  const days = Math.floor((Date.now() - last.getTime()) / 86400000)
  return { daysSinceLastCheckin: days }
}

// ---- Strong and Surrendered (the course) ----
// The three course tables are live; these only read and write rows, never DDL.
// The user is always resolved server-side via requireUser().

export async function enrollInCourse() {
  const { supabase, user } = await requireUser()
  const { error } = await supabase
    .from('course_enrollments')
    .upsert(
      { user_id: user.id, course_slug: COURSE_SLUG, started_on: toISODate(), is_active: true, completed_at: null },
      { onConflict: 'user_id,course_slug' },
    )
  if (error) return { error: error.message }
  revalidatePath('/app')
  revalidatePath('/app/program')
  return { ok: true }
}

export async function unenrollFromCourse() {
  const { supabase, user } = await requireUser()
  const { error } = await supabase
    .from('course_enrollments')
    .update({ is_active: false })
    .eq('user_id', user.id)
    .eq('course_slug', COURSE_SLUG)
  if (error) return { error: error.message }
  revalidatePath('/app')
  revalidatePath('/app/program')
  return { ok: true }
}

export async function completeCourseDay(dayNumber: number) {
  const { supabase, user } = await requireUser()
  const { error } = await supabase
    .from('course_day_progress')
    .upsert(
      { user_id: user.id, course_slug: COURSE_SLUG, day_number: dayNumber, completed_at: new Date().toISOString() },
      { onConflict: 'user_id,course_slug,day_number' },
    )
  if (error) return { error: error.message }
  await bumpStreak(user.id)
  revalidateCourse(dayNumber)
  return { ok: true }
}

export async function uncompleteCourseDay(dayNumber: number) {
  const { supabase, user } = await requireUser()
  const { error } = await supabase
    .from('course_day_progress')
    .delete()
    .eq('user_id', user.id)
    .eq('course_slug', COURSE_SLUG)
    .eq('day_number', dayNumber)
  if (error) return { error: error.message }
  revalidateCourse(dayNumber)
  return { ok: true }
}

/**
 * Upsert on (user_id, course_slug, day_number, prompt_index). Nothing here is
 * ever destructive — this replaces a paper workbook.
 */
export async function saveCourseWriting(input: {
  dayNumber: number
  promptIndex: number
  prompt: string
  body: string
  kind?: WritingKind
}) {
  const { supabase, user } = await requireUser()
  const { error } = await supabase.from('course_writings').upsert(
    {
      user_id: user.id,
      course_slug: COURSE_SLUG,
      day_number: input.dayNumber,
      prompt_index: input.promptIndex,
      prompt: input.prompt,
      body: input.body,
      kind: input.kind ?? 'write',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,course_slug,day_number,prompt_index' },
  )
  if (error) return { error: error.message }
  revalidatePath('/app/write')
  return { ok: true, savedAt: new Date().toISOString() }
}

function revalidateCourse(dayNumber: number) {
  revalidatePath('/app')
  revalidatePath('/app/program')
  revalidatePath(`/app/program/day/${dayNumber}`)
  revalidatePath(`/app/program/week/${Math.floor((dayNumber - 1) / 7) + 1}`)
}

// ---- Food logging ----
// meal_logs could only ever point at one of the sixty recipes. These let her
// log anything, with the macros snapshotted onto the row so correcting a food
// later never rewrites what she already ate.

export async function logFood(input: {
  foodItemId?: string
  customName?: string
  quantity: number
  unit: string
  calories: number
  protein: number
  carbs: number
  fat: number
  mealSlot?: string
  date?: string
}) {
  const { supabase, user } = await requireUser()
  if (!input.foodItemId && !input.customName?.trim()) return { error: 'Give it a name first.' }
  if (!(input.quantity > 0)) return { error: 'How much did you have?' }

  const { error } = await supabase.from('meal_logs').insert({
    user_id: user.id,
    food_item_id: input.foodItemId ?? null,
    custom_name: input.customName?.trim() || null,
    quantity: input.quantity,
    unit: input.unit,
    calories: round1(input.calories),
    protein_g: round1(input.protein),
    carbs_g: round1(input.carbs),
    fat_g: round1(input.fat),
    meal_slot: input.mealSlot ?? null,
    date: input.date ?? toISODate(),
    servings: 1,
  })
  if (error) return { error: error.message }
  await bumpStreak(user.id)
  revalidatePath('/app/nutrition')
  revalidatePath('/app')
  return { ok: true }
}

export async function logRecipeMeal(recipeId: string, servings = 1) {
  const { supabase, user } = await requireUser()
  const { data: recipe } = await supabase.from('recipes').select('calories, protein_g, carbs_g, fat_g, title').eq('id', recipeId).maybeSingle()
  const { error } = await supabase.from('meal_logs').insert({
    user_id: user.id,
    recipe_id: recipeId,
    servings,
    custom_name: recipe?.title ?? null,
    quantity: servings,
    unit: 'serving',
    calories: round1((recipe?.calories ?? 0) * servings),
    protein_g: round1((recipe?.protein_g ?? 0) * servings),
    carbs_g: round1((recipe?.carbs_g ?? 0) * servings),
    fat_g: round1((recipe?.fat_g ?? 0) * servings),
    date: toISODate(),
  })
  if (error) return { error: error.message }
  await bumpStreak(user.id)
  revalidatePath('/app/nutrition')
  revalidatePath('/app')
  return { ok: true }
}

/** Saves a food she typed in so it is one tap next time. */
export async function saveFoodItem(input: {
  name: string
  servingSize: number
  servingUnit: string
  calories: number
  protein: number
  carbs: number
  fat: number
}) {
  const { supabase, user } = await requireUser()
  if (!input.name.trim()) return { error: 'Give it a name first.' }
  const { data, error } = await supabase
    .from('food_items')
    .insert({
      user_id: user.id,
      name: input.name.trim(),
      serving_size: input.servingSize,
      serving_unit: input.servingUnit,
      calories: round1(input.calories),
      protein_g: round1(input.protein),
      carbs_g: round1(input.carbs),
      fat_g: round1(input.fat),
    })
    .select('id')
    .maybeSingle()
  if (error) return { error: error.message }
  revalidatePath('/app/nutrition')
  return { ok: true, id: data?.id as string | undefined }
}

export async function deleteMealLog(id: string) {
  const { supabase, user } = await requireUser()
  const { error } = await supabase.from('meal_logs').delete().eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/app/nutrition')
  revalidatePath('/app')
  return { ok: true }
}

function round1(n: number): number {
  return Math.round((Number.isFinite(n) ? n : 0) * 10) / 10
}

/** Log several foods in one go — a shake is milk plus a scoop, not two trips. */
export async function logFoods(
  entries: { foodItemId: string; quantity: number }[],
  mealSlot?: string,
) {
  const { supabase, user } = await requireUser()
  if (entries.length === 0) return { error: 'Nothing selected.' }

  const ids = entries.map((e) => e.foodItemId)
  const { data: foods, error: readError } = await supabase.from('food_items').select('*').in('id', ids)
  if (readError) return { error: readError.message }
  const byId = new Map((foods ?? []).map((f) => [f.id as string, f]))

  const rows = entries.flatMap((e) => {
    const f = byId.get(e.foodItemId)
    if (!f || !(f.serving_size > 0) || !(e.quantity > 0)) return []
    const factor = e.quantity / f.serving_size
    return [
      {
        user_id: user.id,
        food_item_id: f.id,
        custom_name: f.name,
        quantity: e.quantity,
        unit: f.serving_unit,
        calories: round1(f.calories * factor),
        protein_g: round1(f.protein_g * factor),
        carbs_g: round1(f.carbs_g * factor),
        fat_g: round1(f.fat_g * factor),
        meal_slot: mealSlot ?? null,
        date: toISODate(),
        servings: 1,
      },
    ]
  })
  if (rows.length === 0) return { error: 'Nothing to log.' }

  const { error } = await supabase.from('meal_logs').insert(rows)
  if (error) return { error: error.message }
  await bumpStreak(user.id)
  revalidatePath('/app/nutrition')
  revalidatePath('/app/nutrition/log')
  revalidatePath('/app')
  return { ok: true, count: rows.length }
}

/** Her body and goal, from which the daily targets are calculated. */
export async function saveBodyGoals(input: {
  weight: number | null
  weightUnit: 'lb' | 'kg'
  heightCm: number | null
  birthYear: number | null
  activityLevel: string | null
  bodyGoal: string | null
}) {
  const { supabase, user } = await requireUser()
  const weightKg =
    input.weight == null ? null : input.weightUnit === 'lb' ? Math.round(input.weight * 0.45359237 * 10) / 10 : input.weight
  const { error } = await supabase
    .from('profiles')
    .update({
      weight_kg: weightKg,
      weight_unit: input.weightUnit,
      height_cm: input.heightCm,
      birth_year: input.birthYear,
      activity_level: input.activityLevel,
      body_goal: input.bodyGoal,
    })
    .eq('id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/app/nutrition')
  revalidatePath('/app/nutrition/log')
  revalidatePath('/app')
  return { ok: true }
}

/** Per-phase percentage shifts, and the dates the phase is worked out from. */
export async function saveCycleSettings(input: {
  lastPeriodStart: string | null
  cycleLengthDays: number | null
  adjustments: Record<string, number>
}) {
  const { supabase, user } = await requireUser()
  const clean: Record<string, number> = {}
  for (const [k, v] of Object.entries(input.adjustments)) {
    if (['menstrual', 'follicular', 'ovulation', 'luteal'].includes(k) && Number.isFinite(v)) {
      clean[k] = Math.max(Math.min(Math.round(v), 30), -30)
    }
  }
  const { error } = await supabase
    .from('profiles')
    .update({
      last_period_start: input.lastPeriodStart,
      cycle_length_days: input.cycleLengthDays,
      cycle_adjustments: clean,
    })
    .eq('id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/app/nutrition/log')
  revalidatePath('/app/nutrition/goals')
  return { ok: true }
}

// ---- Household + learning ----

export async function addHouseholdMember(input: { name: string; birthYear?: number | null; color?: string }) {
  const { supabase, user } = await requireUser()
  if (!input.name.trim()) return { error: 'Give them a name.' }
  const { count } = await supabase
    .from('household_members')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', user.id)
  const { error } = await supabase.from('household_members').insert({
    owner_id: user.id,
    name: input.name.trim(),
    birth_year: input.birthYear ?? null,
    color: input.color ?? 'sapphire',
    position: count ?? 0,
  })
  if (error) return { error: error.message }
  revalidatePath('/app/learning')
  return { ok: true }
}

export async function removeHouseholdMember(id: string) {
  const { supabase, user } = await requireUser()
  const { error } = await supabase.from('household_members').delete().eq('id', id).eq('owner_id', user.id).eq('is_self', false)
  if (error) return { error: error.message }
  revalidatePath('/app/learning')
  return { ok: true }
}

export async function addLearningItem(input: { memberId: string | null; subject: string; title: string; cadence?: string; notes?: string }) {
  const { supabase, user } = await requireUser()
  if (!input.title.trim()) return { error: 'What is it called?' }
  const { error } = await supabase.from('learning_items').insert({
    owner_id: user.id,
    member_id: input.memberId,
    subject: input.subject.trim() || 'General',
    title: input.title.trim(),
    notes: input.notes?.trim() || null,
    cadence: input.cadence ?? 'once',
  })
  if (error) return { error: error.message }
  revalidatePath('/app/learning')
  revalidatePath('/app')
  return { ok: true }
}

export async function toggleLearningItem(itemId: string) {
  const { supabase, user } = await requireUser()
  const today = toISODate()
  const { data: existing } = await supabase
    .from('learning_completions')
    .select('id')
    .eq('owner_id', user.id)
    .eq('item_id', itemId)
    .eq('date', today)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase.from('learning_completions').delete().eq('id', existing.id)
    if (error) return { error: error.message }
    revalidatePath('/app/learning')
    return { ok: true, done: false }
  }
  const { error } = await supabase.from('learning_completions').insert({ owner_id: user.id, item_id: itemId, date: today })
  if (error) return { error: error.message }
  await bumpStreak(user.id)
  revalidatePath('/app/learning')
  revalidatePath('/app')
  return { ok: true, done: true }
}

export async function archiveLearningItem(itemId: string) {
  const { supabase, user } = await requireUser()
  const { error } = await supabase.from('learning_items').update({ archived: true }).eq('id', itemId).eq('owner_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/app/learning')
  return { ok: true }
}
