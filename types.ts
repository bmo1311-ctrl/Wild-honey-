export type Pillar = 'Body' | 'Identity' | 'Mindset' | 'Faith'
export type MembershipTier = 'free' | 'circle' | 'inner-circle' | 'founder'
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

export interface CommunityPost {
  id: string
  user_id: string
  text: string
  image_url: string | null
  pillar: Pillar | null
  pinned: boolean
  created_at: string
  profile?: Pick<Profile, 'name' | 'avatar_color' | 'membership_tier'> | null
  reaction_count?: number
  comment_count?: number
  reacted_by_me?: boolean
}

export interface CommunityComment {
  id: string
  post_id: string
  user_id: string
  text: string
  pinned: boolean
  created_at: string
  profile?: Pick<Profile, 'name' | 'avatar_color' | 'membership_tier'> | null
}

export interface Workout {
  id: string
  title: string
  description: string
  pillar: Pillar
  video_url: string | null
  instructions: string | null
  image_url: string | null
  pdf_url: string | null
  is_premium: boolean
  created_at: string
}

export interface MealPlan {
  id: string
  title: string
  description: string
  content: string | null
  file_url: string | null
  is_premium: boolean
  created_at: string
}

export interface GroceryList {
  id: string
  title: string
  items: string
  meal_plan_id: string | null
  is_premium: boolean
  created_at: string
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
  group_id: string | null
  my_group_membership?: boolean
}

export type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal' | 'not_tracked'

export interface Checkin {
  id: string
  user_id: string
  date: string
  energy: number | null
  mood: string | null
  stress: number | null
  sleep_quality: number | null
  hydration_oz: number | null
  protein_g: number | null
  sunlight_minutes: number | null
  movement_minutes: number | null
  cycle_phase: CyclePhase | null
  symptoms: string[]
  created_at: string
}

export interface MorningReset {
  id: string
  user_id: string
  date: string
  intention: string | null
  gratitude: string | null
  completed_at: string
}

export interface EveningReflection {
  id: string
  user_id: string
  date: string
  q1: string | null
  q2: string | null
  q3: string | null
  created_at: string
}

export type WinKind = 'win' | 'gratitude' | 'prayer' | 'compliment' | 'courage'

export interface Win {
  id: string
  user_id: string
  date: string
  kind: WinKind
  text: string
  created_at: string
}

export interface TodayFocus {
  headline: string
  oneThing: string
  suggestions: string[]
  estimatedMinutes: number
  suggestedProtocolSlug?: string | null
}

export interface Habit {
  id: string
  user_id: string
  title: string
  anchor: string | null
  pillar: Pillar | null
  archived: boolean
  created_at: string
}

export interface HabitLog {
  id: string
  habit_id: string
  user_id: string
  date: string
  completed_at: string
}

export interface ProtocolEnrollment {
  id: string
  user_id: string
  protocol_slug: string
  is_active: boolean
  started_at: string
  ended_at: string | null
}

export interface ProtocolDayCompletion {
  id: string
  enrollment_id: string
  user_id: string
  day_number: number
  completed_at: string
}

export type PantryCategory = 'produce' | 'protein' | 'dairy' | 'grains' | 'pantry' | 'frozen' | 'spices' | 'other'

export interface PantryItem {
  id: string
  user_id: string
  name: string
  category: PantryCategory
  quantity: string | null
  running_low: boolean
  created_at: string
}

export interface GroceryBuilderItem {
  id: string
  user_id: string
  name: string
  category: PantryCategory
  quantity: string | null
  checked: boolean
  created_at: string
}

export type ResourceType = 'article' | 'video' | 'pdf' | 'audio' | 'link'

export interface Resource {
  id: string
  title: string
  description: string | null
  url: string | null
  resource_type: ResourceType
  pillar: Pillar | null
  created_at: string
  saved?: boolean
}

export interface Group {
  id: string
  name: string
  description: string | null
  invite_code: string
  pillar: Pillar | null
  retreat_id: string | null
  created_by: string
  created_at: string
  member_count?: number
  my_role?: 'owner' | 'member'
}

export interface GroupMember {
  id: string
  group_id: string
  user_id: string
  role: 'owner' | 'member'
  joined_at: string
  profile?: Pick<Profile, 'name' | 'avatar_color' | 'membership_tier'> | null
}

export interface GroupPost {
  id: string
  group_id: string
  user_id: string
  text: string
  created_at: string
  profile?: Pick<Profile, 'name' | 'avatar_color' | 'membership_tier'> | null
  reaction_count?: number
  comment_count?: number
  reacted_by_me?: boolean
}

export interface GroupPostComment {
  id: string
  post_id: string
  user_id: string
  text: string
  created_at: string
  profile?: Pick<Profile, 'name' | 'avatar_color'> | null
}

export interface ExpertQuestion {
  id: string
  user_id: string
  pillar: Pillar | null
  question: string
  answer: string | null
  answered_at: string | null
  is_public: boolean
  created_at: string
  profile?: Pick<Profile, 'name' | 'avatar_color'> | null
}
