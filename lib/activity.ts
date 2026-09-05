/**
 * One activity model for the whole app.
 *
 * A day counts as active if she did anything that day — ticked a course day,
 * logged a habit, logged a meal, or checked in on how she felt. Before this,
 * two streaks disagreed: profiles.streak_count was bumped from nine places and
 * reset to 1 on any miss, while the dashboard counted course days alone. So
 * logging a meal moved one number and not the other.
 *
 * Everything here is derived from rows she actually created. Nothing is stored,
 * so nothing can drift out of sync with the truth.
 */

export type ActivitySource = 'course' | 'habit' | 'meal' | 'checkin'

export interface ActivityDay {
  date: string
  sources: ActivitySource[]
}

export function buildActivity(input: Record<ActivitySource, string[]>): ActivityDay[] {
  const byDate = new Map<string, Set<ActivitySource>>()
  for (const source of Object.keys(input) as ActivitySource[]) {
    for (const raw of input[source]) {
      const date = raw.slice(0, 10)
      if (!date) continue
      if (!byDate.has(date)) byDate.set(date, new Set())
      byDate.get(date)!.add(source)
    }
  }
  return [...byDate.entries()]
    .map(([date, sources]) => ({ date, sources: [...sources] }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export interface Streaks {
  current: number
  longest: number
  lastActive: string | null
  activeToday: boolean
}

/**
 * A gap ends the current run but never erases the longest one. A run still
 * counts as current if it reaches yesterday — she has not broken anything by
 * not having opened the app yet this morning.
 */
export function streaksFrom(days: ActivityDay[], today = isoToday()): Streaks {
  if (days.length === 0) return { current: 0, longest: 0, lastActive: null, activeToday: false }
  const dates = days.map((d) => d.date)

  let longest = 1
  let run = 1
  for (let i = 1; i < dates.length; i++) {
    run = dayGap(dates[i - 1], dates[i]) === 1 ? run + 1 : 1
    if (run > longest) longest = run
  }

  const last = dates[dates.length - 1]
  const gap = dayGap(last, today)
  return {
    current: gap === 0 || gap === 1 ? run : 0,
    longest,
    lastActive: last,
    activeToday: gap === 0,
  }
}

/** How many of the last n days had any activity. */
export function consistency(days: ActivityDay[], n = 7, today = isoToday()): { hit: number; of: number; dates: string[] } {
  const window: string[] = []
  for (let i = n - 1; i >= 0; i--) window.push(addDays(today, -i))
  const active = new Set(days.map((d) => d.date))
  return { hit: window.filter((d) => active.has(d)).length, of: n, dates: window }
}

/** Average of a numeric check-in field over the last n days, and the shift from the n before that. */
export function trend(points: { date: string; value: number | null }[], n = 7, today = isoToday()): { recent: number | null; shift: number | null } {
  const cut = addDays(today, -n)
  const prevCut = addDays(today, -n * 2)
  const recent = points.filter((p) => p.date > cut && p.value != null).map((p) => p.value as number)
  const previous = points.filter((p) => p.date > prevCut && p.date <= cut && p.value != null).map((p) => p.value as number)
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)
  const r = avg(recent)
  const p = avg(previous)
  return { recent: r === null ? null : Math.round(r * 10) / 10, shift: r === null || p === null ? null : Math.round((r - p) * 10) / 10 }
}

export function isoToday(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function addDays(date: string, delta: number): string {
  const t = Date.parse(`${date}T00:00:00Z`) + delta * 86_400_000
  return new Date(t).toISOString().slice(0, 10)
}

function dayGap(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000)
}
