export type Pillar = 'Body' | 'Identity' | 'Mindset' | 'Faith'
export type MembershipTier = 'free' | 'circle' | 'inner-circle' | 'founder'
export type Visibility = 'private' | 'circle'

export type Season =
  | 'rebuilding'
  | 'growing'
  | 'healing'
  | 'motherhood'
  | 'entrepreneurship'
  | 'career_expansion'
  | 'transition'
  | 'deepening_faith'
  | 'finding_balance'
  | 'becoming_healthiest'

export type FaithPreference = 'regularly' | 'occasionally' | 'when_i_choose' | 'not_now'

export type CommunicationStyle = 'gentle' | 'direct' | 'inspirational' | 'educational' | 'reminders' | 'deep_dives'

export type Goal =
  | 'more_energy'
  | 'better_sleep'
  | 'stress_reduction'
  | 'strength'
  | 'nourishment'
  | 'womens_health_education'
  | 'confidence'
  | 'spiritual_growth'
  | 'emotional_wellness'
  | 'better_routines'
  | 'community'
  | 'joy'

export interface Profile {
  id: string
  name: string
  email: string | null
  avatar_color: string
  avatar_url: string | null
  membership_tier: MembershipTier
  is_admin: boolean
  streak_count: number
  last_active_date: string | null
  created_at: string
  birthday: string | null
  age_range: string | null
  timezone: string | null
  season: Season | null
  faith_preference: FaithPreference | null
  communication_style: CommunicationStyle | null
  wake_time: string | null
  bedtime: string | null
  movement_preference: string | null
  hydration_goal_oz: number | null
  caffeine: string | null
  foods_avoided: string | null
  allergies: string | null
  onboarding_completed_at: string | null
  notification_prefs: NotificationPrefs
  quiet_hours_start: string | null
  quiet_hours_end: string | null
  data_consent_at: string | null
  daily_calorie_goal: number | null
  daily_protein_goal_g: number | null
}

export interface Commitment {
  id: string
  user_id: string
  text: string
  status: 'active' | 'released' | 'replaced' | 'completed'
  replaced_by_id: string | null
  created_at: string
  last_reviewed_at: string
}

export interface PersonalExperiment {
  id: string
  user_id: string
  title: string
  description: string | null
  length_days: number
  start_date: string
  status: 'active' | 'completed' | 'abandoned'
  helped: 'yes' | 'somewhat' | 'no' | null
  reflection_text: string | null
  reflected_at: string | null
  created_at: string
  days_completed?: number
}

export interface MealLog {
  id: string
  user_id: string
  recipe_id: string
  servings: number
  date: string
  created_at: string
  recipe?: Recipe
}

export interface NotificationPrefs {
  morning_checkin?: boolean
  hydration?: boolean
  movement?: boolean
  journal?: boolean
  evening_reflection?: boolean
  new_content?: boolean
  retreat_announcements?: boolean
}

export interface UserGoal {
  id: string
  user_id: string
  goal: Goal
  created_at: string
}

export interface VitalityCheckin {
  id: string
  user_id: string
  energy: number | null
  mood: number | null
  stress: number | null
  sleep: number | null
  confidence: number | null
  motivation: number | null
  mental_clarity: number | null
  physical_strength: number | null
  label: 'baseline' | 'checkpoint'
  note: string | null
  taken_at: string
}

export interface Recipe {
  id: string
  title: string
  description: string | null
  ingredients: string
  instructions: string
  pillar: Pillar | null
  prep_minutes: number | null
  image_url: string | null
  video_url: string | null
  is_premium: boolean
  season: 'spring' | 'summer' | 'fall' | 'winter' | 'any'
  cycle_phase: CyclePhase | 'any'
  budget_tier: 'budget' | 'moderate' | 'splurge'
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'juice' | 'mocktail' | 'any'
  kid_friendly: boolean
  protein_g: number | null
  calories: number | null
  carbs_g: number | null
  fat_g: number | null
  nutrition_highlights: string | null
  created_at: string
  saved?: boolean
}

export interface Challenge {
  id: string
  title: string
  description: string | null
  pillar: Pillar | null
  length_days: number
  is_active: boolean
  created_at: string
  joined?: boolean
  days_completed?: number
  participant_count?: number
}

export interface ChallengeCheckin {
  id: string
  challenge_id: string
  user_id: string
  date: string
  created_at: string
}

export type Milestone = '30_day' | '60_day' | '90_day' | 'custom' | 'year_day'

export interface TransformationReflection {
  id: string
  user_id: string
  milestone: Milestone
  q_changed: string | null
  q_proud: string | null
  q_different: string | null
  q_becoming: string | null
  q_learned: string | null
  q_overcame: string | null
  q_patterns: string | null
  q_release: string | null
  q_carrying_forward: string | null
  q_intention: string | null
  wild_honey_year: number | null
  created_at: string
}

export interface UserBlock {
  id: string
  blocker_id: string
  blocked_id: string
  created_at: string
}

export interface UserMute {
  id: string
  muter_id: string
  muted_id: string
  created_at: string
}

export type ContentType = 'journal_entry' | 'community_post' | 'community_comment' | 'group_post' | 'group_post_comment' | 'circle_comment'

export interface ContentReport {
  id: string
  reporter_id: string
  content_type: ContentType
  content_id: string
  reason: string
  status: 'pending' | 'reviewed' | 'dismissed' | 'removed'
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  reporter_profile?: Pick<Profile, 'name' | 'avatar_color' | 'avatar_url'> | null
}

export type CircleFeedItem =
  | { kind: 'journal'; id: string; pinned: boolean; created_at: string; entry: JournalEntry }
  | { kind: 'community'; id: string; pinned: boolean; created_at: string; post: CommunityPost }

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
  profile?: Pick<Profile, 'name' | 'avatar_color' | 'avatar_url'> | null
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
  profile?: Pick<Profile, 'name' | 'avatar_color' | 'avatar_url'> | null
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
  profile?: Pick<Profile, 'name' | 'avatar_color' | 'avatar_url' | 'membership_tier'> | null
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
  profile?: Pick<Profile, 'name' | 'avatar_color' | 'avatar_url' | 'membership_tier'> | null
}

export interface Workout {
  id: string
  title: string
  description: string
  pillar: Pillar
  body_group: 'full_body' | 'upper_body' | 'lower_body' | 'core' | 'glutes' | 'arms' | 'back' | 'any'
  workout_type: 'strength' | 'cardio' | 'stretch' | 'mobility' | 'hiit' | 'yoga' | 'recovery' | 'any'
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
  image_url: string | null
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
  profile?: Pick<Profile, 'name' | 'avatar_color' | 'avatar_url' | 'membership_tier'> | null
}

export interface GroupPost {
  id: string
  group_id: string
  user_id: string
  text: string
  created_at: string
  profile?: Pick<Profile, 'name' | 'avatar_color' | 'avatar_url' | 'membership_tier'> | null
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
  profile?: Pick<Profile, 'name' | 'avatar_color' | 'avatar_url'> | null
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
  profile?: Pick<Profile, 'name' | 'avatar_color' | 'avatar_url'> | null
}
