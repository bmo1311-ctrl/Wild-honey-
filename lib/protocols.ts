export interface ProtocolDay {
  day: number
  title: string
  actions: string[]
}

export interface Protocol {
  slug: string
  title: string
  tagline: string
  pillar: 'Body' | 'Identity' | 'Mindset' | 'Faith'
  lengthDays: number
  days: ProtocolDay[]
  /** when this protocol should be suggested, in plain language */
  bestFor: string
}

export const PROTOCOLS: Protocol[] = [
  {
    slug: 'energy-reset',
    title: 'Energy Reset',
    tagline: 'five days to rebuild steady energy without relying on caffeine.',
    pillar: 'Body',
    lengthDays: 5,
    bestFor: 'low energy, afternoon crashes, feeling wiped out',
    days: [
      { day: 1, title: 'baseline', actions: ['log your energy check-in', 'protein at breakfast, not just carbs', 'lights out by 10:30'] },
      { day: 2, title: 'sunlight + movement', actions: ['10 minutes of morning sunlight', 'a 15-minute walk', 'water before coffee'] },
      { day: 3, title: 'steady blood sugar', actions: ['protein or fat with every meal today', 'skip the 3pm sugar reach for fruit + nuts', 'note your energy at 3pm'] },
      { day: 4, title: 'wind-down', actions: ['no screens 30 min before bed', 'a short gratitude note before sleep', 'consistent bedtime'] },
      { day: 5, title: 'check in', actions: ['log your energy check-in', 'compare to day 1', 'decide what stays in your routine'] },
    ],
  },
  {
    slug: 'better-sleep',
    title: 'Better Sleep',
    tagline: 'a five-day reset for falling asleep easier and waking up steadier.',
    pillar: 'Body',
    lengthDays: 5,
    bestFor: 'poor sleep quality, trouble falling asleep, restless nights',
    days: [
      { day: 1, title: 'baseline', actions: ['log tonight\u2019s sleep quality tomorrow morning', 'no caffeine after 2pm', 'set a consistent bedtime'] },
      { day: 2, title: 'morning light', actions: ['get outside within an hour of waking', 'skip the snooze button', 'move your body for 10 minutes'] },
      { day: 3, title: 'evening wind-down', actions: ['dim the lights an hour before bed', 'no screens in bed', 'try the evening reflection prompt'] },
      { day: 4, title: 'consistency', actions: ['same wake time as yesterday', 'a warm, non-caffeinated drink before bed', 'write down tomorrow\u2019s one priority so your mind can rest'] },
      { day: 5, title: 'check in', actions: ['log your sleep quality', 'compare to day 1', 'keep whatever helped most'] },
    ],
  },
  {
    slug: 'calm-nervous-system',
    title: 'Calm Down',
    tagline: 'five days of small resets to bring a wired nervous system back down.',
    pillar: 'Mindset',
    lengthDays: 5,
    bestFor: 'high stress, feeling wired or overwhelmed, racing thoughts',
    days: [
      { day: 1, title: 'notice it', actions: ['log your stress check-in', 'name one thing actually in your control today', 'try the calming breath (4 in, 4 hold, 6 out)'] },
      { day: 2, title: 'create margin', actions: ['cancel or postpone one optional thing', 'step outside for 5 minutes before your hardest task', 'say no to one new request'] },
      { day: 3, title: 'ground', actions: ['5 minutes with no phone', 'a short walk with no destination', 'write one worry down and set it aside'] },
      { day: 4, title: 'connect', actions: ['tell one person how you\u2019re actually doing', 'do one small kind thing for yourself', 'evening reflection tonight'] },
      { day: 5, title: 'check in', actions: ['log your stress check-in', 'compare to day 1', 'pick one practice to keep'] },
    ],
  },
  {
    slug: 'cycle-synced-movement',
    title: 'Cycle-Synced Movement',
    tagline: 'a gentler approach to movement that works with your cycle, not against it.',
    pillar: 'Body',
    lengthDays: 5,
    bestFor: 'PMS, cramping, cycle-related fatigue, wanting to train smarter not harder',
    days: [
      { day: 1, title: 'track your phase', actions: ['log your cycle phase in today\u2019s check-in', 'notice your energy without judging it', 'gentle stretching if energy is low'] },
      { day: 2, title: 'match the intensity', actions: ['high energy: a real workout. low energy: a walk.', 'protein-forward meals', 'magnesium-rich foods if cramping'] },
      { day: 3, title: 'rest is allowed', actions: ['permission to skip a workout if you need to', 'warmth on the belly or lower back if cramping', 'note any symptoms in your check-in'] },
      { day: 4, title: 'movement as medicine', actions: ['choose movement that feels good, not punishing', 'hydrate well', 'sleep a little earlier tonight'] },
      { day: 5, title: 'check in', actions: ['log your check-in', 'notice what your body needed this week', 'plan next week around your actual cycle'] },
    ],
  },
]

export function getProtocol(slug: string): Protocol | undefined {
  return PROTOCOLS.find((p) => p.slug === slug)
}

/** Suggest a protocol slug based on the day's check-in, or null if nothing fits strongly. */
export function suggestProtocol(latest: { energy: number | null; sleep_quality: number | null; stress: number | null; symptoms: string[] } | null): string | null {
  if (!latest) return null
  const energy = latest.energy ?? 5
  const sleep = latest.sleep_quality ?? 5
  const stress = latest.stress ?? 5
  const symptoms = latest.symptoms ?? []

  if (symptoms.includes('PMS') || symptoms.includes('bloating')) return 'cycle-synced-movement'
  if (stress >= 7) return 'calm-nervous-system'
  if (sleep <= 3) return 'better-sleep'
  if (energy <= 3) return 'energy-reset'
  return null
}
