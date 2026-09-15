import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { localToday } from '@/lib/today'
import { computeState, headline, type CapacityLevel, type PersonalState, type StateInput } from '@/lib/personal-state'

/**
 * Reading the woman, not the app.
 *
 * `lib/personal-state.ts` is pure arithmetic — give it rows, it gives back a
 * reading. This file is the half that knows where the rows live. Keeping them
 * apart is what makes the maths testable without a database, and it is why
 * every threshold in there could be argued with in a plain node script.
 *
 * Everything here reads through the ordinary server client, so Row Level
 * Security scopes it to her own rows. There is no path in this file that can
 * see another member's data, which matters more here than almost anywhere
 * else in the app: this is the file that decides what the app believes about
 * someone.
 */

/** How far back anything is worth pulling. Beyond this it is history, not state. */
const WINDOW_DAYS = 60

/**
 * Dates here must be *her* dates.
 *
 * This used `isoToday()`, which is the server's day — UTC on Vercel. Every row
 * it compares against is dated with `localToday()`: `checkins.date`,
 * `meal_logs.date`, `habit_logs.date` are all written in her timezone. For
 * anyone ahead of UTC the two disagree for part of every day, and then
 * `recentCheckins` throws today's check-in away for having a negative gap.
 *
 * Worst case, and it was live: `saveCheckin` calls `recordPersonalState()`
 * immediately after writing the row, so the reading saved right after a
 * check-in was computed as though that check-in did not exist — which at four
 * check-ins is exactly the boundary where the card stops saying anything.
 */
function daysBefore(today: string, days: number): string {
  return new Date(Date.parse(`${today}T00:00:00Z`) - days * 86_400_000).toISOString().slice(0, 10)
}

/**
 * Gather everything the state layer needs, in one pass.
 *
 * Fifteen small queries rather than one clever join, because they are all
 * indexed on user_id and they run in parallel — and because a join across
 * fifteen tables would be unreadable the first time something in it went
 * wrong. Every one of them is allowed to fail without taking the page down:
 * a missing table or a permission change should cost confidence, not the
 * whole surface.
 */
export const readStateInput = cache(async (): Promise<StateInput | null> => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const today = await localToday()
  const from = daysBefore(today, WINDOW_DAYS)

  /*
   * Eight queries, down from fifteen.
   *
   * Seven of them — journal entries, course writings, goals, meal logs,
   * course day progress, evening reflections, morning resets — existed only
   * to feed `awareness` and `alignment`, and both of those are deleted (see
   * CONSCIOUSNESS.md). They are removed rather than left computing something
   * nothing reads: this runs on a page with a ten-second function ceiling,
   * and a pile of unread queries is exactly how Today went down once already.
   *
   * What remains is what capacity is actually made of: how she has been, and
   * how much is on her.
   */
  const [profile, checkins, commitments, experiments, enrollments, habits, habitLogs, studioBlocks] =
    await Promise.all([
      supabase.from('profiles').select('seasons').eq('id', user.id).maybeSingle(),
      supabase
        .from('checkins')
        .select('date, energy, sleep_quality, stress')
        .gte('date', from)
        .order('date', { ascending: true }),
      supabase.from('commitments').select('status'),
      supabase.from('personal_experiments').select('status'),
      supabase.from('course_enrollments').select('course_slug').eq('is_active', true),
      supabase.from('habits').select('id').eq('archived', false),
      supabase.from('habit_logs').select('habit_id, date').gte('date', from),
      supabase.from('studio_blocks').select('id').eq('is_active', true),
    ])

  /*
   * Noticing is writing *and* reflecting. Both evening reflections and morning
   * resets are her putting words to her own state, which is the thing this
   * measure is supposed to be about.
   */
  /*
   * `writingDates` and `activeDays` were built here and fed `awareness` and
   * `alignment`. Both readings are deleted — they scored her on how often she
   * used this app and reported it back as facts about her self-awareness and
   * her integrity. See CONSCIOUSNESS.md.
   *
   * The queries behind them are gone too rather than left computing something
   * nothing reads. A dozen unread queries on a page with a ten-second ceiling
   * is how Today went down once already.
   */
  return {
    today,
    checkins: (checkins.data ?? []) as StateInput['checkins'],
    seasons: (profile.data?.seasons as string[] | null) ?? [],
    // Only what is still running counts as load. A commitment she finished
    // is not weight she is carrying.
    commitments: (commitments.data ?? []).filter((c) => c.status === 'active'),
    experiments: (experiments.data ?? []).filter((e) => e.status === 'active'),
    activeCourses: (enrollments.data ?? []).map((e) => e.course_slug as string),
    habits: (habits.data ?? []) as { id: string }[],
    habitLogs: (habitLogs.data ?? []) as { habit_id: string; date: string }[],
    studioBlocks: (studioBlocks.data ?? []) as { id: string }[],
  }
})

/**
 * How long a dismissed headline stays gone.
 *
 * Her account today reads 'stretched' off load alone — four seasons, two
 * programmes — and load barely moves week to week. Without this, the single
 * strongest sentence the app can say would appear on Today every morning
 * until she dropped a season, and by the third morning it would be furniture.
 *
 * So: she can put it away, and it does not come back for a fortnight unless
 * the reading itself changes, in which case it is a different sentence and
 * worth hearing.
 */
const HEADLINE_QUIET_DAYS = 14

interface HeadlineMemory {
  text?: string
  dismissedOn?: string
}

/**
 * Her state right now, plus the one line worth leading with — or null when
 * there is not enough to say anything, which early on is most of the time.
 */
export const getPersonalState = cache(
  async (): Promise<{ state: PersonalState; lead: ReturnType<typeof headline> } | null> => {
    const input = await readStateInput()
    if (!input) return null
    const state = computeState(input)
    let lead = headline(state)

    if (lead) {
      const supabase = await createClient()
      const { data } = await supabase
        .from('transformation_state')
        .select('state_json')
        .maybeSingle()
      const memory = ((data?.state_json as { headline?: HeadlineMemory } | null)?.headline ?? {}) as HeadlineMemory
      if (memory.text === lead.text && memory.dismissedOn) {
        const gap = Math.round((Date.parse(input.today) - Date.parse(memory.dismissedOn)) / 86_400_000)
        if (gap >= 0 && gap < HEADLINE_QUIET_DAYS) lead = null
      }
    }

    return { state, lead }
  },
)

/**
 * She has read it. Put it away.
 *
 * Merged into `state_json` rather than overwriting, so this never clobbers
 * the reading `recordPersonalState` left there.
 */
export async function dismissHeadline(text: string): Promise<void> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase.from('transformation_state').select('state_json').maybeSingle()
    const existing = (data?.state_json as Record<string, unknown> | null) ?? {}

    await supabase.from('transformation_state').upsert(
      {
        user_id: user.id,
        state_json: { ...existing, headline: { text, dismissedOn: await localToday() } },
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )
  } catch {
    // Worst case the sentence shows again tomorrow. Not worth an error.
  }
}

/*
 * Turning a capacity level into the smallint the table wants.
 *
 * `transformation_state.capacity_score` predates this engine, and capacity
 * here is a level rather than a number — three honest bands instead of a
 * false precision like 63. These midpoints exist so the column stays usable
 * for ordering and for spotting a change over weeks. They are a rendering of
 * the level, not a measurement, and nothing should read them back as one.
 */
const CAPACITY_SCORE = { stretched: 20, available: 55, abundant: 85 } as const

/** The three score columns are smallint, and the engine works in fractions. */
function smallint(n: number | null): number | null {
  return n === null ? null : Math.round(n)
}

/**
 * Write today's reading down.
 *
 * Separate from reading on purpose. A server component that quietly wrote to
 * the database every time it rendered would make history depend on how often
 * she happened to open a page, and Phase 2 is going to want this series to
 * mean something. So this is called from actions — after a check-in, after
 * an evening reflection — where a write is already expected.
 *
 * Never throws. If the write fails she still gets her page; what is lost is
 * one day of a trend line, and that is not worth an error screen.
 */
export async function recordPersonalState(): Promise<void> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const input = await readStateInput()
    if (!input) return
    const state = computeState(input)

    // Nothing known is not a reading. Writing zeroes would make an empty
    // account indistinguishable from a depleted one for anything reading
    // these columns later.
    if (state.evidence === 'none') return

    // Read first so the headline memory survives. Two writers on one jsonb
    // column is exactly how a dismissed message comes back the next morning.
    const { data: prev } = await supabase.from('transformation_state').select('state_json').maybeSingle()
    const headlineMemory = (prev?.state_json as { headline?: HeadlineMemory } | null)?.headline

    await supabase.from('transformation_state').upsert(
      {
        user_id: user.id,
        capacity_score:
          state.capacity.confidence === 'none' ? null : CAPACITY_SCORE[state.capacity.value],
        vitality_score: smallint(state.vitality.value),
        // awareness_score and alignment_score are written as null from here
        // on. The columns stay so the history is not rewritten — what the app
        // believed about her in September is a real thing it believed — but
        // nothing computes them any more.
        awareness_score: null,
        alignment_score: null,
        // The full reading, reasons included, so a later phase can ask why
        // the app said what it said on a given day rather than guessing.
        state_json: {
          ...(state as unknown as Record<string, unknown>),
          ...(headlineMemory ? { headline: headlineMemory } : {}),
        },
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )
  } catch {
    // Deliberately silent. See above.
  }
}

/**
 * Today's capacity, read rather than recomputed.
 *
 * Today makes more database round trips than any page in the app, and
 * `getPersonalState` once added eighteen more and tipped it over the ten
 * second ceiling — `/app` returned Bad Gateway while every other route stayed
 * at 200. It is eight queries now rather than fifteen, which is better and
 * still not free.
 *
 * But the reading is already written down. `recordPersonalState` stores it on
 * every check-in, which is the event that actually moves it. So this is one
 * row, one column, and no engine.
 *
 * Stale by design: it is as fresh as the last time she told the app
 * something. That is the right kind of stale — capacity should change when
 * she says how she is, not when she happens to open the app.
 *
 * Null when there is nothing recorded, and the caller decides what to do with
 * not knowing. It must not be read as 'stretched'.
 */
export const getRecordedCapacity = cache(async function getRecordedCapacity(): Promise<CapacityLevel | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('transformation_state')
    .select('capacity_score')
    .eq('user_id', user.id)
    .maybeSingle()
  const score = (data as { capacity_score?: number | null } | null)?.capacity_score
  if (score == null) return null
  // The inverse of CAPACITY_SCORE above, by midpoint.
  if (score <= 37) return 'stretched'
  if (score <= 70) return 'available'
  return 'abundant'
})
