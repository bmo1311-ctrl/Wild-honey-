import type { Pillar } from '@/lib/types'

export interface SparkLine {
  pillar: Pillar
  text: string
}

// A curated bank of short daily intention lines, in Wild Honey's voice.
// One is picked deterministically per member per day — personalized by
// goal-pillar weighting, but never random noise that changes on refresh.
export const SPARK_LINES: SparkLine[] = [
  // Body
  { pillar: 'Body', text: "you don't have to earn rest today." },
  { pillar: 'Body', text: 'your body already knows how to heal. let it.' },
  { pillar: 'Body', text: 'move today because it feels good, not because you owe it.' },
  { pillar: 'Body', text: 'nourishment is not a reward. it is a baseline.' },
  { pillar: 'Body', text: 'slow down enough to actually feel what your body is telling you.' },
  { pillar: 'Body', text: 'strength looks different today than it did yesterday. both count.' },
  { pillar: 'Body', text: 'you are allowed to take up space, literally and otherwise.' },
  { pillar: 'Body', text: 'your energy is information, not a personal failure.' },

  // Identity
  { pillar: 'Identity', text: 'you get to decide who you are today. no one else does.' },
  { pillar: 'Identity', text: "you don't have to perform to be worthy of being here." },
  { pillar: 'Identity', text: "the version of you that's showing up right now is enough." },
  { pillar: 'Identity', text: 'stop auditioning for approval you already have.' },
  { pillar: 'Identity', text: "who you're becoming doesn't have to be loud to be real." },
  { pillar: 'Identity', text: "you are allowed to outgrow who you used to be." },
  { pillar: 'Identity', text: 'your worth was never up for debate.' },
  { pillar: 'Identity', text: "you don't need a reason to just be yourself today." },

  // Mindset
  { pillar: 'Mindset', text: 'today does not have to be productive to be good.' },
  { pillar: 'Mindset', text: 'you can change your mind. that is not failure.' },
  { pillar: 'Mindset', text: 'notice the story you are telling yourself before you believe it.' },
  { pillar: 'Mindset', text: 'progress is quieter than you think it should be.' },
  { pillar: 'Mindset', text: 'you are allowed to rest before you are exhausted.' },
  { pillar: 'Mindset', text: 'one small true thing today is enough.' },
  { pillar: 'Mindset', text: "not every thought deserves your full attention." },
  { pillar: 'Mindset', text: 'you get to choose what you carry into today.' },

  // Faith
  { pillar: 'Faith', text: "you don't have to carry this alone." },
  { pillar: 'Faith', text: 'you are not behind. you are exactly where you are.' },
  { pillar: 'Faith', text: 'let today be lighter than you expected it to be.' },
  { pillar: 'Faith', text: 'surrender is not the same as giving up.' },
  { pillar: 'Faith', text: 'you were never meant to control everything.' },
  { pillar: 'Faith', text: 'rest in the part of the story you cannot see yet.' },
  { pillar: 'Faith', text: 'you are held even on the days you forget to notice.' },
  { pillar: 'Faith', text: 'trust today, even the parts that feel unfinished.' },
]

const GOAL_PILLAR: Record<string, Pillar> = {
  more_energy: 'Body',
  better_sleep: 'Body',
  strength: 'Body',
  nourishment: 'Body',
  womens_health_education: 'Body',
  confidence: 'Identity',
  community: 'Identity',
  joy: 'Identity',
  stress_reduction: 'Mindset',
  emotional_wellness: 'Mindset',
  better_routines: 'Mindset',
  spiritual_growth: 'Faith',
}

/** Simple deterministic string hash so the pick is stable per user per day. */
function hashString(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

export function pickSparkLine(userId: string, goals: string[], faithPreference: string | null | undefined): SparkLine {
  const faithOptedOut = faithPreference === 'not_now' || !faithPreference

  const pillarCounts = new Map<Pillar, number>()
  goals.forEach((g) => {
    const pillar = GOAL_PILLAR[g]
    if (pillar) pillarCounts.set(pillar, (pillarCounts.get(pillar) ?? 0) + 1)
  })
  const topCount = Math.max(0, ...Array.from(pillarCounts.values()))
  const topPillars = new Set(Array.from(pillarCounts.entries()).filter(([, c]) => c === topCount && topCount > 0).map(([p]) => p))

  const todayKey = new Date().toISOString().slice(0, 10)
  const pool = SPARK_LINES.filter((l) => !(faithOptedOut && l.pillar === 'Faith'))
  const preferred = topPillars.size > 0 ? pool.filter((l) => topPillars.has(l.pillar)) : pool
  const finalPool = preferred.length > 0 ? preferred : pool

  const index = hashString(`${userId}:${todayKey}`) % finalPool.length
  return finalPool[index]
}
