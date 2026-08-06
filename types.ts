export type Pillar = 'Body' | 'Identity' | 'Mindset' | 'Faith'
export type MembershipTier = 'free' | 'circle' | 'inner-circle'
export type Visibility = 'private' | 'circle'

export interface Profile {
  id: string
  name: string
  email: string | null
  avatar_color: string
  membership_tier: MembershipTier
  is_admin: boolean
  streak_count: number
  last_active_date: string | null
  created_at: string
}

export interface Prompt {
  id: string
  pillar: Pillar
  text: string
  date_scheduled: string
  is_premium: boolean
  created_at: string
}

export interface JournalEntry {
  id: string
  user_id: string
  prompt_id: string | null
  text: string
  visibility: Visibility
  created_at: string
  prompt?: Prompt | null
  profile?: Pick<Profile, 'name' | 'avatar_color'> | null
  reaction_count?: number
  comment_count?: number
  reacted_by_me?: boolean
}

export interface Comment {
  id: string
  entry_id: string
  user_id: string
  text: string
  created_at: string
  profile?: Pick<Profile, 'name' | 'avatar_color'> | null
}

export interface Product {
  id: string
  title: string
  description: string
  price_cents: number
  stripe_price_id: string | null
  file_url: string | null
  cover_image: string | null
  is_published: boolean
  created_at: string
  owned?: boolean
}

export interface Retreat {
  id: string
  title: string
  location: string
  dates: string
  description: string
  price_cents: number
  spots_total: number
  spots_taken: number
  cover_image: string | null
  created_at: string
  signed_up?: boolean
}
