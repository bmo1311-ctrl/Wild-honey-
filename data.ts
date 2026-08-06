import { createClient } from '@/lib/supabase/server'
import type { JournalEntry, Product, Profile, Prompt, Retreat } from '@/lib/types'

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
    .select('*, prompt:prompts(*), profile:profiles(name, avatar_color)')
    .eq('visibility', 'circle')
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
  return retreats.map((r) => ({ ...r, signed_up: mine.has(r.id) }))
}
