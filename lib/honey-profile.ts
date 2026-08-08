import type { CommunicationStyle, FaithPreference, Goal, Season } from './types'

export const SEASON_META: Record<Season, { label: string; description: string }> = {
  rebuilding: { label: 'rebuilding', description: 'putting the pieces back together, on your own terms' },
  growing: { label: 'growing', description: 'stretching into more of who you are' },
  healing: { label: 'healing', description: 'giving something the time it needs' },
  motherhood: { label: 'motherhood', description: 'in it, wherever "it" is right now' },
  entrepreneurship: { label: 'entrepreneurship', description: 'building something of your own' },
  career_expansion: { label: 'career expansion', description: 'stepping into more responsibility, more reach' },
  transition: { label: 'transition', description: "somewhere between what was and what's next" },
  deepening_faith: { label: 'deepening faith', description: 'wanting to go further, closer' },
  finding_balance: { label: 'finding balance', description: 'tired of choosing between everything that matters' },
  becoming_healthiest: { label: 'becoming my healthiest self', description: 'ready to actually feel good in your body' },
}

export const SEASONS: Season[] = Object.keys(SEASON_META) as Season[]

export const GOAL_META: Record<Goal, string> = {
  more_energy: 'more energy',
  better_sleep: 'better sleep',
  stress_reduction: 'less stress',
  strength: 'strength',
  nourishment: 'nourishment',
  womens_health_education: "women's health education",
  confidence: 'confidence',
  spiritual_growth: 'spiritual growth',
  emotional_wellness: 'emotional wellness',
  better_routines: 'better routines',
  community: 'community',
  joy: 'joy',
}

export const GOALS: Goal[] = Object.keys(GOAL_META) as Goal[]

export const COMMUNICATION_META: Record<CommunicationStyle, { label: string; description: string }> = {
  gentle: { label: 'gentle encouragement', description: 'soft nudges, no pressure' },
  direct: { label: 'direct accountability', description: 'tell it to me straight' },
  inspirational: { label: 'inspirational', description: 'meet me with vision and heart' },
  educational: { label: 'educational', description: 'give me the why behind it' },
  reminders: { label: 'short reminders', description: 'quick, low-key nudges' },
  deep_dives: { label: 'deep dives', description: 'give me the full picture' },
}

export const COMMUNICATION_STYLES: CommunicationStyle[] = Object.keys(COMMUNICATION_META) as CommunicationStyle[]

export const FAITH_META: Record<FaithPreference, string> = {
  regularly: 'yes, regularly',
  occasionally: 'occasionally',
  when_i_choose: 'only when I choose',
  not_now: 'not right now',
}

export const FAITH_OPTIONS: FaithPreference[] = Object.keys(FAITH_META) as FaithPreference[]

export const VITALITY_DIMENSIONS: { key: string; label: string }[] = [
  { key: 'energy', label: 'energy' },
  { key: 'mood', label: 'mood' },
  { key: 'stress', label: 'stress' },
  { key: 'sleep', label: 'sleep' },
  { key: 'confidence', label: 'confidence' },
  { key: 'motivation', label: 'motivation' },
  { key: 'mental_clarity', label: 'mental clarity' },
  { key: 'physical_strength', label: 'physical strength' },
]
