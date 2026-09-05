import courseJson from '@/lib/courses/strong-and-surrendered.json'

/** Block types, exactly as they appear in the course JSON. */
export type Block =
  | { t: 'text'; v: string }
  | { t: 'h'; v: string }
  | { t: 'quote'; v: string; by?: string }
  | { t: 'steps'; title?: string; items: { n: number; head: string; sub?: string }[] }
  | { t: 'figure'; pose: string; label: string; cue?: string }
  | { t: 'grid'; title?: string; cols: string[]; rows: string[][] }
  | { t: 'versus'; title?: string; left: { head: string; items: string[] }; right: { head: string; items: string[] } }
  | { t: 'write'; prompt: string; lines?: number }
  | { t: 'check'; title?: string; items: string[]; demo?: string }
  | { t: 'rate'; q: string; left?: string; right?: string }
  | { t: 'scripture'; ref: string; text: string; why?: string }
  | { t: 'log' }
  | { t: 'note'; tone?: 'warn' | 'scope' | 'note'; title?: string; v: string }

export type DayKind = 'teaching' | 'practice' | 'session' | 'rest' | 'milestone'

export interface CourseDay {
  day_number: number
  week_number: number
  title: string
  kind: DayKind
  minutes: number
  blocks: Block[]
}

export interface CourseWeek {
  week_number: number
  title: string
  verb: string
  principle: string
  opening_line: string
  stakes: string
  pull_quote: string
  blocks: Block[]
}

export interface Course {
  slug: string
  title: string
  subtitle: string
  length_days: number
  weeks: number
  week_list: CourseWeek[]
  days: CourseDay[]
}

export const COURSE = courseJson as unknown as Course
export const COURSE_SLUG = COURSE.slug

export function getDay(dayNumber: number): CourseDay | null {
  return COURSE.days.find((d) => d.day_number === dayNumber) ?? null
}

export function getWeek(weekNumber: number): CourseWeek | null {
  return COURSE.week_list.find((w) => w.week_number === weekNumber) ?? null
}

export function daysInWeek(weekNumber: number): CourseDay[] {
  return COURSE.days.filter((d) => d.week_number === weekNumber)
}

export function weekOfDay(dayNumber: number): number {
  return Math.floor((dayNumber - 1) / 7) + 1
}

export function clampDay(day: number): number {
  return Math.min(Math.max(day, 1), COURSE.length_days)
}

/**
 * Days elapsed since started_on, plus 1, clamped to 1–56. Both dates are
 * read as plain calendar days so a member who opens the app at 11pm and
 * again at 7am the next morning moves exactly one day, regardless of zone.
 */
export function currentDayFrom(startedOn: string, today = new Date()): number {
  const start = Date.parse(`${startedOn.slice(0, 10)}T00:00:00Z`)
  const now = Date.parse(`${toISODate(today)}T00:00:00Z`)
  if (Number.isNaN(start) || Number.isNaN(now)) return 1
  const elapsed = Math.floor((now - start) / 86_400_000)
  return clampDay(elapsed + 1)
}

export function toISODate(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * Milestone days share the shape text -> steps -> tail. Part 1 is the seated
 * work, part 2 is on her feet. Split at render time; the content is unchanged.
 */
export function splitMilestone(blocks: Block[]): { part1: Block[]; part2: Block[] } | null {
  const cut = blocks.map((b) => b.t).lastIndexOf('steps') + 1
  if (cut <= 0 || cut >= blocks.length) return null
  return { part1: blocks.slice(0, cut), part2: blocks.slice(cut) }
}

/**
 * Stable identity for a saveable block within a day, used as prompt_index.
 * It is the block's position in the day's blocks array, so a write, a check
 * and a rate on the same day never collide on the unique key — and it stays
 * stable because the course copy is frozen.
 */
export function promptIndexOf(blocks: Block[], block: Block): number {
  return blocks.indexOf(block)
}

/** What a course_writings row holds, since the table stores all three. */
export type WritingKind = 'write' | 'rate' | 'check'


/** Rows in the three live course tables. Do not alter those tables. */
export interface CourseEnrollment {
  id: string
  user_id: string
  course_slug: string
  started_on: string
  is_active: boolean
  completed_at: string | null
  created_at: string
}

export interface CourseDayProgress {
  id: string
  user_id: string
  course_slug: string
  day_number: number
  completed_at: string
}

export interface CourseWriting {
  id: string
  user_id: string
  course_slug: string
  day_number: number
  prompt_index: number
  prompt: string
  body: string
  kind: WritingKind
  updated_at: string
}
