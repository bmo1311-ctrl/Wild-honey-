'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Comment, Visibility } from '@/lib/types'

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

export async function updateProfile(input: { name: string; avatarColor: string }) {
  const { supabase, user } = await requireUser()
  const { error } = await supabase
    .from('profiles')
    .update({ name: input.name.trim() || 'honey', avatar_color: input.avatarColor })
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

export async function adminAddResource(input: { title: string; description?: string; url?: string; resourceType: string; pillar?: string }) {
  const { supabase } = await requireAdmin()
  const title = input.title.trim()
  if (!title) return { error: 'Give the resource a title first.' }
  const { error } = await supabase.from('resources').insert({
    title,
    description: input.description?.trim() || null,
    url: input.url?.trim() || null,
    resource_type: input.resourceType || 'article',
    pillar: input.pillar || null,
  })
  if (error) return { error: error.message }
  revalidatePath('/app/vault')
  revalidatePath('/admin/resources')
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
