/**
 * The noticing engine.
 *
 * One true sentence, or silence.
 *
 * Rules, not a language model — on purpose. A model generates warmth, which
 * comes out as "You're doing amazing on your journey!" and reads as a machine
 * trying to sound like a friend. A rule can only say something it can point
 * at in the data, so it comes out as "four days running now", which is quiet
 * and specific and true. Specificity is what makes someone feel noticed.
 *
 * Three rules this file keeps:
 *
 *   1. Count what she did, never what she missed. Accountability turns into
 *      shame the moment it starts totting up absences, and the women this is
 *      built for have usually had enough of that.
 *   2. No percentages, no scores, no progress bars in words. Being measured
 *      is the opposite of being known.
 *   3. Say nothing most days. Something that speaks every single morning is
 *      not noticing, it is just running. Silence is a feature.
 */

import type { Checkin, Commitment, Habit, HabitLog, Win } from '@/lib/types'

export interface NoticeInput {
  firstName: string | null
  /** Most recent first. */
  checkins: Checkin[]
  habits: Habit[]
  habitLogs: HabitLog[]
  wins: Win[]
  commitments: Commitment[]
  /** Days she has written or completed, most recent first, as YYYY-MM-DD. */
  activeDays: string[]
  currentProgram: { title: string; day: number; length: number } | null
  today: string
}

export interface Notice {
  /** The line itself. Lowercase, her voice, one sentence. */
  text: string
  /** Where tapping it should go, when there is somewhere useful. */
  href?: string
  /** Used for ordering and for not repeating the same kind two days running. */
  kind: string
}

/** Small numbers read as words. "4 days running" sounds counted; "four" sounds noticed. */
const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']
function spell(n: number): string {
  return WORDS[n] ?? String(n)
}

function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(a) - Date.parse(b)) / 86_400_000)
}

/** Consecutive days ending today or yesterday. Never counts gaps as failures. */
function runLength(days: string[], today: string): number {
  if (days.length === 0) return 0
  const set = new Set(days)
  const cursor = new Date(today)
  if (!set.has(cursor.toISOString().slice(0, 10))) cursor.setDate(cursor.getDate() - 1)
  let run = 0
  while (set.has(cursor.toISOString().slice(0, 10))) {
    run += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return run
}

/**
 * Every candidate line, richest first. The caller takes one.
 *
 * Each rule returns nothing unless it can point at something real, which is
 * why silence is the common case rather than the exception.
 */
export function buildNotices(input: NoticeInput): Notice[] {
  const out: Notice[] = []
  const { today, checkins, habits, habitLogs, wins, commitments, activeDays, currentProgram } = input

  // --- She has been away. Say so warmly, and make returning cost nothing. ---
  const lastActive = activeDays[0]
  if (lastActive && daysBetween(today, lastActive) >= 7) {
    out.push({
      text: 'you’re back. nothing expired while you were gone.',
      kind: 'return',
    })
    // Nothing else should speak on a day like this.
    return out
  }

  // --- A run worth naming. Counts days done, never days skipped. ---
  const run = runLength(activeDays, today)
  if (run >= 3) {
    out.push({
      text: `${spell(run)} days running now.`,
      kind: 'run',
    })
  }

  // --- A habit that is actually sticking. ---
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weekAgoStr = weekAgo.toISOString().slice(0, 10)
  for (const habit of habits.filter((h) => !h.archived)) {
    const hits = habitLogs.filter((l) => l.habit_id === habit.id && l.date >= weekAgoStr).length
    if (hits >= 4) {
      out.push({
        text: `${habit.title.toLowerCase()} — ${spell(hits)} of the last seven days. it’s becoming yours.`,
        href: '/app/becoming',
        kind: 'habit',
      })
      break
    }
  }

  // --- A commitment she made and has not looked at in a while. ---
  const stale = commitments
    .filter((c) => c.status === 'active')
    .find((c) => daysBetween(today, c.last_reviewed_at ?? c.created_at) >= 14)
  if (stale) {
    out.push({
      text: `you said "${stale.text.toLowerCase()}". still true?`,
      href: '/app/calendar',
      kind: 'commitment',
    })
  }

  // --- Three nights of bad sleep is a pattern, not a bad night. ---
  const recentSleep = checkins.slice(0, 3).map((c) => c.sleep_quality).filter((n): n is number => n != null)
  if (recentSleep.length === 3 && recentSleep.every((n) => n <= 3)) {
    out.push({
      text: 'third night in a row of thin sleep. the better sleep reset is five days.',
      href: '/app/protocols',
      kind: 'sleep',
    })
  }

  // --- Her own win, said back to her. ---
  const recentWin = wins.find((w) => daysBetween(today, w.date) <= 2)
  if (recentWin) {
    out.push({
      text: `you wrote down "${recentWin.text.toLowerCase()}". worth keeping where you can see it.`,
      href: '/app/energy',
      kind: 'win',
    })
  }

  // --- Where she is in a program, framed as available, never as behind. ---
  if (currentProgram && currentProgram.day <= currentProgram.length) {
    out.push({
      text: `day ${currentProgram.day} of ${currentProgram.title.toLowerCase()} is here when you are.`,
      href: '/app/program',
      kind: 'program',
    })
  }

  return out
}

/**
 * The single thing worth saying today, or null.
 *
 * `lastKind` is whatever was shown yesterday, so the same sort of line does
 * not arrive twice in a row and start sounding automated.
 */
export function pickNotice(input: NoticeInput, lastKind?: string | null): Notice | null {
  const notices = buildNotices(input)
  if (notices.length === 0) return null
  const fresh = notices.filter((n) => n.kind !== lastKind)
  return (fresh[0] ?? notices[0]) ?? null
}
