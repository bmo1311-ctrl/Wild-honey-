import strongAndSurrendered from '@/lib/courses/strong-and-surrendered.json'
import dailyBread from '@/lib/courses/daily-bread.json'
import stillWaters from '@/lib/courses/still-waters.json'
import theHonestRoom from '@/lib/courses/the-honest-room.json'

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
  /**
   * False when weeks are not all seven days long. Daily Bread's week four runs
   * nine days on purpose, so day 29 and 30 are still week four — the
   * (day-1)/7+1 formula puts them in a week five that does not exist.
   */
  week_from_day?: boolean
  /**
   * Which weekdays the course advances on (0 = Sunday … 6 = Saturday). Absent
   * means every day. The Honest Room is written four days a week, so it moves
   * Monday to Thursday and holds still Friday to Sunday.
   */
  cadence?: { weekdays: number[] }
}

/** Pacing lives here, beside the registry, so the content files stay content. */
const CADENCE: Record<string, { weekdays: number[] }> = {
  'the-honest-room': { weekdays: [1, 2, 3, 4] },
}

export const COURSES: Course[] = [
  strongAndSurrendered as unknown as Course,
  dailyBread as unknown as Course,
  stillWaters as unknown as Course,
  theHonestRoom as unknown as Course,
].map((c) => (CADENCE[c.slug] ? { ...c, cadence: CADENCE[c.slug] } : c))

export function getCourse(slug: string): Course | null {
  return COURSES.find((c) => c.slug === slug) ?? null
}

/** The original course, kept for the handful of places that still assume one. */
export const COURSE = COURSES[0]
export const COURSE_SLUG = COURSE.slug

export function getDay(course: Course, dayNumber: number): CourseDay | null {
  return course.days.find((d) => d.day_number === dayNumber) ?? null
}

export function getWeek(course: Course, weekNumber: number): CourseWeek | null {
  return course.week_list.find((w) => w.week_number === weekNumber) ?? null
}

export function daysInWeek(course: Course, weekNumber: number): CourseDay[] {
  return course.days.filter((d) => d.week_number === weekNumber)
}

/**
 * Always ask the day which week it is in. Only fall back to arithmetic for a
 * day number that has no entry, which should not happen for a valid course.
 */
export function weekOfDay(course: Course, dayNumber: number): number {
  const day = getDay(course, dayNumber)
  if (day) return day.week_number
  return Math.min(Math.floor((dayNumber - 1) / 7) + 1, course.weeks)
}

export function clampDay(course: Course, day: number): number {
  return Math.min(Math.max(day, 1), course.length_days)
}

/**
 * Days elapsed since started_on, plus 1, clamped to 1–56. Both dates are
 * read as plain calendar days so a member who opens the app at 11pm and
 * again at 7am the next morning moves exactly one day, regardless of zone.
 */
export function currentDayFrom(course: Course, startedOn: string, todayISO?: string): number {
  const start = Date.parse(`${startedOn.slice(0, 10)}T00:00:00Z`)
  const now = Date.parse(`${(todayISO ?? toISODate()).slice(0, 10)}T00:00:00Z`)
  if (Number.isNaN(start) || Number.isNaN(now)) return 1
  const elapsed = Math.floor((now - start) / 86_400_000)
  if (!course.cadence) return clampDay(course, elapsed + 1)
  // The day she starts is always day one. After that, only the set weekdays
  // count, so a four-day course takes its full ten weeks.
  const on = new Set(course.cadence.weekdays)
  let day = 1
  for (let i = 1; i <= elapsed; i++) {
    if (on.has(new Date(start + i * 86_400_000).getUTCDay())) day++
  }
  return clampDay(course, day)
}

/** True when the course does not move today — a rest day in a paced course. */
export function isRestDay(course: Course, todayISO: string): boolean {
  if (!course.cadence) return false
  const t = Date.parse(`${todayISO.slice(0, 10)}T00:00:00Z`)
  return !course.cadence.weekdays.includes(new Date(t).getUTCDay())
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

export type Pillar4 = 'Body' | 'Identity' | 'Mindset' | 'Faith'

/**
 * Which pillars a day works in, read off its blocks. The course JSON does not
 * label days, but the block types say what she is doing: shapes and the log
 * are Body, a written answer is Mindset, a self-rating or a "done means"
 * check is Identity, scripture is Faith. A day can be several.
 */
export function pillarsOf(blocks: Block[]): Pillar4[] {
  const out = new Set<Pillar4>()
  for (const b of blocks) {
    if (b.t === 'figure' || b.t === 'log') out.add('Body')
    if (b.t === 'steps' && /shape|walk|squat|carry|session|train|floor|minutes/i.test(JSON.stringify(b))) out.add('Body')
    if (b.t === 'write') out.add('Mindset')
    if (b.t === 'rate' || b.t === 'check') out.add('Identity')
    if (b.t === 'scripture') out.add('Faith')
    if (b.t === 'quote' && /god|lord|pray|faith|scripture|psalm|jesus/i.test(b.v)) out.add('Faith')
  }
  const list = (['Body', 'Identity', 'Mindset', 'Faith'] as Pillar4[]).filter((p) => out.has(p))
  // a body-first course: a day that reads as nothing in particular is a Body day
  return list.length ? list : ['Body']
}

/** The pillar to show for a day: what an admin set, else what the blocks say. */
export function pillarOfDay(day: CourseDay, overrides: Record<number, Pillar4>): Pillar4[] {
  const set = overrides[day.day_number]
  return set ? [set] : pillarsOf(day.blocks)
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
