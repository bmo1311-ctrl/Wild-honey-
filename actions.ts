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
    .select('*, profile:profiles(name, avatar_color)')
    .eq('entry_id', entryId)
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
  const byTier = { free: 0, circle: 0, 'inner-circle': 0 } as Record<string, number>
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
