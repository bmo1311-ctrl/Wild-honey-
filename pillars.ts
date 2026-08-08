import type { Pillar } from './types'

export const PILLARS: Pillar[] = ['Body', 'Identity', 'Mindset', 'Faith']

interface PillarMeta {
  label: Pillar
  description: string
  /** tailwind text color class */
  text: string
  /** tailwind background tint class */
  chip: string
  dot: string
}

export const PILLAR_META: Record<Pillar, PillarMeta> = {
  Body: {
    label: 'Body',
    description: 'Coming home to the vessel you live in.',
    text: 'text-[color:var(--pillar-body)]',
    chip: 'bg-[color:var(--pillar-body)]/12 text-[color:var(--pillar-body)]',
    dot: 'bg-[color:var(--pillar-body)]',
  },
  Identity: {
    label: 'Identity',
    description: 'Remembering and becoming who you are.',
    text: 'text-[color:var(--pillar-identity)]',
    chip: 'bg-[color:var(--pillar-identity)]/12 text-[color:var(--pillar-identity)]',
    dot: 'bg-[color:var(--pillar-identity)]',
  },
  Mindset: {
    label: 'Mindset',
    description: 'Tending the stories you tell yourself.',
    text: 'text-[color:var(--pillar-mindset)]',
    chip: 'bg-[color:var(--pillar-mindset)]/12 text-[color:var(--pillar-mindset)]',
    dot: 'bg-[color:var(--pillar-mindset)]',
  },
  Faith: {
    label: 'Faith',
    description: 'Trusting the path before you can see it.',
    text: 'text-[color:var(--pillar-faith)]',
    chip: 'bg-[color:var(--pillar-faith)]/12 text-[color:var(--pillar-faith)]',
    dot: 'bg-[color:var(--pillar-faith)]',
  },
}

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100)
}

export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  const now = Date.now()
  const diff = Math.max(0, now - then)
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** Client-safe: no server imports. Counts the current consecutive-day streak for a habit. */
export function computeHabitStreak(habitId: string, logs: { habit_id: string; date: string }[]): number {
  const dates = new Set(logs.filter((l) => l.habit_id === habitId).map((l) => l.date))
  let streak = 0
  const cursor = new Date()
  if (!dates.has(cursor.toISOString().slice(0, 10))) cursor.setDate(cursor.getDate() - 1)
  while (dates.has(cursor.toISOString().slice(0, 10))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}
