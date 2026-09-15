import Link from 'next/link'
import { ChevronRight, Flame } from 'lucide-react'
import { KidToday } from '@/components/kid-today'
import { BaselineCardLink } from '@/components/baseline-card'
import { suggestHabits } from '@/lib/habit-suggestions'
import { weekOfDay } from '@/lib/courses'
import { loadCourse, loadCourses, loadDay } from '@/lib/courses-db'
import { localHour, localToday } from '@/lib/today'
import { buildActivity, consistency, streaksFrom } from '@/lib/activity'
import { QuickAddHabit } from '@/components/quick-add-habit'
import { NoticeLine } from '@/components/notice-line'
import { MomentCard } from '@/components/moment-card'
import { CheckinInline } from '@/components/checkin-inline'
import { MorningResetCard } from '@/components/morning-reset-card'
import { EveningReflectionCard } from '@/components/evening-reflection-card'
import { ResetPanel } from '@/components/reset-panel'
import { buildMoment, greetingFor } from '@/lib/moment'
import { candidatesFor } from '@/lib/moment-candidates'
import { planTonight } from '@/lib/tonight'
import { planWash } from '@/lib/wash-day'
import { daysUntil, planBlock, type StudioBlock, type StudioItem } from '@/lib/studio'
import type { ShelfItem } from '@/lib/routine'
import { getSeason } from '@/lib/color-season'
import { outfitForToday } from '@/lib/outfit'
import type { Body, Scale, Shape, VerticalProportion } from '@/lib/silhouette'
import { pickNotice } from '@/lib/noticing'
import { getRecordedCapacity } from '@/lib/personal-state-db'
import { getAccess,
  getActiveCourseState,
  getActivityDates,
  getKidRewards,
  getLearningItems,
  getMeasurements,
  getMoney,
  getOwnerScope,
  getHabits,
  getRecentHabitLogs,
  getBaselineVitality,
  getMyGoals,
  getMyCommitments,
  getRecentCheckins,
  getRecentWins,
  getSessionProfile,
  getTodayCheckin,
  getTodayNutrition,
  getMemberProducts,
  getRoutineLog,
  getStudioBlocks,
  getStudioItems,
  getStudioSessionsThisWeek,
  getTodayPrompt,
  getMyEntryForPrompt,
  getWardrobe,
  getStyleProfile,
  getTodayMorningReset,
  getTodayEveningReflection,
} from '@/lib/data'

/**
 * The dashboard. Stats she has earned at the top, then one plain list of what
 * today actually needs — tickable where it can be ticked, and a link straight
 * to the work where it can't.
 */
export default async function TodayPage({ searchParams }: { searchParams: Promise<{ course?: string }> }) {
  const { course: preferred } = await searchParams
  const me = await getSessionProfile()
  if (me?.is_child) {
    const scope = await getOwnerScope()
    const [items, nutrition, kid] = await Promise.all([
      getLearningItems(scope?.childMemberId ?? null),
      getTodayNutrition(scope?.childMemberId ?? null),
      scope?.childMemberId ? getKidRewards(scope.childMemberId) : Promise.resolve(null),
    ])
    const stars = items.filter((i) => i.doneToday).length + (nutrition.loggedMeals.length > 0 ? 1 : 0)
    const all = await loadCourses()
    const programs = (me.child_permissions?.program ?? [])
      .map((slug) => all.find((c) => c.slug === slug))
      .filter((c): c is NonNullable<typeof c> => Boolean(c))
      .map((c) => ({ slug: c.slug, title: c.title }))
    return <KidToday name={me.name?.split(' ')[0] ?? 'there'} items={items} mealsToday={nutrition.loggedMeals.length} starsThisWeek={stars} programs={programs} earned={(kid?.balance.waiting ?? 0) + (kid?.balance.ready ?? 0)} />
  }
  /*
   * Everything this page needs that does not depend on anything else, in one
   * round trip.
   *
   * This used to be five separate awaits in a row — seven queries, then the
   * course, then the date, then the day, then seven more, then the hour, then
   * ten more. Each group sat waiting for the one before it even though almost
   * none of them needed its result, so the page's wall-clock time was the sum
   * of five round trips rather than the slowest of one.
   *
   * That waterfall is why `/app` was the only route that ever timed out, and
   * why it got closer to the edge with every surface added this week. Only
   * the course and its day genuinely depend on something earlier; they follow
   * below. Everything else belongs here.
   */
  const [
    { slug, enrollment, currentDay, completedDays },
    profile,
    activityDates,
    checkin,
    nutrition,
    habits,
    habitLogs,
    today,
    hour,
    baseline,
    goals,
    recentCheckins,
    measurements,
    money,
    commitments,
    wins,
    beautyProducts,
    routineLog,
    studioBlocks,
    studioItems,
    studioSessions,
    prompt,
    garments,
    style,
    morning,
    evening,
    access,
    capacity,
  ] = await Promise.all([
    getActiveCourseState(preferred),
    getSessionProfile(),
    getActivityDates(),
    getTodayCheckin(),
    getTodayNutrition(),
    getHabits(),
    getRecentHabitLogs(7),
    localToday(),
    localHour(),
    getBaselineVitality(),
    getMyGoals(),
    getRecentCheckins(30),
    getMeasurements(),
    getMoney(),
    getMyCommitments(),
    getRecentWins(10),
    getMemberProducts(),
    getRoutineLog(30),
    getStudioBlocks(),
    getStudioItems(),
    getStudioSessionsThisWeek(),
    getTodayPrompt(),
    getWardrobe(),
    getStyleProfile(),
    getTodayMorningReset(),
    getTodayEveningReflection(),
    // Reads her own profile, which is already cached — no reason for it to
    // have been its own await two hundred lines further down.
    getAccess(),
    /*
     * One row, not the engine.
     *
     * `getPersonalState` on this page is what returned Bad Gateway once —
     * eighteen queries on a function with a ten second ceiling. The reading
     * is already written down on every check-in, so this reads it: one row,
     * one column. See getRecordedCapacity.
     */
    getRecordedCapacity(),
  ])

  // The only two that genuinely have to wait: the day needs the course, and
  // the course needs the slug the enrollment above resolved.
  const course = await loadCourse(slug)
  const activity = buildActivity(activityDates)
  const streaks = streaksFrom(activity, today)
  const week = consistency(activity, 7, today)
  const day = course && currentDay ? await loadDay(slug, currentDay) : null
  const dayDone = currentDay ? completedDays.includes(currentDay) : false
  const pct = course ? Math.round((completedDays.length / course.length_days) * 100) : 0
  const loggedHabitIds = new Set(habitLogs.filter((l) => l.date === today).map((l) => l.habit_id))

  // One true sentence, or nothing. Built from what she has actually done.
  const notice = pickNotice({
    firstName: profile?.name?.split(' ')[0] ?? null,
    checkins: [...recentCheckins].reverse(),
    habits,
    habitLogs,
    wins,
    commitments,
    activeDays: [...new Set(Object.values(activityDates).flat())].sort().reverse(),
    currentProgram: course && currentDay ? { title: course.title, day: currentDay, length: course.length_days } : null,
    today,
  })
  const lastWeigh = measurements[measurements.length - 1]?.date ?? null
  const lastMoney = money.entries[0]?.date ?? null
  const since = (d: string | null) => (d ? Math.floor((Date.parse(today) - Date.parse(d)) / 86_400_000) : null)
  const lastCheckin = recentCheckins[recentCheckins.length - 1]?.date ?? null
  const daysSinceCheckin = lastCheckin ? Math.floor((Date.parse(today) - Date.parse(lastCheckin)) / 86_400_000) : null
  const habitSuggestions = suggestHabits(goals.map((g) => g.goal), habits.map((h) => h.title))

  /*
   * Counters that can only ever say something true and kind.
   *
   * A streak of zero under a flame, with "best 12" beside it, tells a woman
   * who has been ill for a week that she has lost something. She has not —
   * the days she did are still done. So a broken run shows the best run as
   * the number instead, and the percentage is gone: nine per cent of
   * fifty-six days is a discouraging way to describe five real mornings.
   */
  const stats = [
    { label: 'Day', value: currentDay ? `${currentDay}` : '—', sub: course ? `of ${course.length_days}` : '' },
    streaks.current > 0
      ? { label: 'Run', value: `${streaks.current}`, sub: streaks.current === 1 ? 'day' : 'days', flame: true }
      : { label: 'Best run', value: `${streaks.longest}`, sub: streaks.longest === 1 ? 'day' : 'days', flame: true },
    { label: 'Done', value: `${completedDays.length}`, sub: completedDays.length === 1 ? 'day' : 'days' },
    {
      label: 'Protein',
      value: nutrition.protein ? `${Math.round(nutrition.protein)}` : '0',
      sub: nutrition.proteinGoal ? `of ${nutrition.proteinGoal}g` : 'g today',
    },
  ]

  /*
   * The moment.
   *
   * Today was a list in the order `lib/modules.ts` happened to declare its
   * modules, and the only intelligence in it was putting unfinished things
   * first. Which meant it showed her tonight's retinal at seven in the
   * morning, her check-in at eleven at night, and — because Protocols and
   * Studio were never registered as modules at all — it never showed the two
   * engines in this app that actually decide something.
   *
   * So the three surfaces Today has never seen get fetched here: her shelf
   * and routine log (Protocols), her blocks and pipeline (Studio), and
   * today's prompt (Write). Each one is asked what it wants, and the moment
   * engine picks whichever fits the hour she is in.
   */
  const promptEntry = prompt ? await getMyEntryForPrompt(prompt.id) : null

  const shelfFor = (areaKey: string): ShelfItem[] =>
    beautyProducts
      .filter((p) => (p.domains?.length ? p.domains.includes(areaKey as never) : p.domain === areaKey))
      .map((p) => ({
        id: p.id,
        name: p.custom_name ?? p.product?.name ?? 'a product',
        category: p.category ?? p.product?.category ?? null,
        actives: p.actives?.length ? p.actives : (p.product?.actives ?? []),
        timeOfDay: p.time_of_day,
        frequencyPerWeek: p.frequency_per_week,
      }))

  const skinShelf = shelfFor('skin')
  const hairShelf = shelfFor('hair')
  const tonight =
    skinShelf.length > 0
      ? planTonight({ shelf: skinShelf, log: routineLog, today, allergies: profile?.allergies })
      : null
  const tonightDone = tonight
    ? routineLog.some(
        (l) =>
          l.date === today &&
          (l.memberProductId === tonight.treatment?.id ||
            tonight.alongside.some((a) => a.id === l.memberProductId)),
      )
    : false
  const wash = hairShelf.length > 0 ? planWash({ shelf: hairShelf, log: routineLog, today }) : null
  const washedToday = wash
    ? routineLog.some((l) => l.date === today && wash.steps.some((s) => s.id === l.memberProductId))
    : false

  // Only the blocks that fall today. A Thursday block is not this moment.
  const todayWeekday = new Date(`${today}T12:00:00`).getDay()
  const keptBlockIds = new Set(studioSessions.map((s) => s.blockId).filter(Boolean) as string[])
  const studioToday = (studioBlocks as StudioBlock[])
    .filter((b) => daysUntil(b, todayWeekday, today) === 0)
    .map((block) => ({
      block,
      plan: planBlock(block, studioItems as StudioItem[], today),
      kept: keptBlockIds.has(block.id),
    }))

  /*
   * What to wear, but only when the wardrobe can actually answer.
   *
   * Four pieces and a colour season and a frame, or it says nothing at all.
   * A suggestion built from two shirts and no idea what suits her is worse
   * than silence, and silence is a thing this app is allowed to do.
   */
  const season = getSeason(style?.season)
  const styleBody: Body | null =
    style?.shape && style?.vertical && style?.scale
      ? { shape: style.shape as Shape, vertical: style.vertical as VerticalProportion, scale: style.scale as Scale }
      : null
  const look =
    season && styleBody && garments.length >= 4
      ? outfitForToday({ garments, occasion: 'everyday', season, body: styleBody, today })
      : null
  const outfit = look
    ? {
        label: look.pieces.map((p) => p.name).join(' + '),
        detail: look.colourStory,
        done: look.pieces.every((p) => p.lastWornOn === today),
      }
    : null

  const moment = buildMoment({
    hour,
    name: profile?.name?.split(' ')[0] ?? null,
    candidates: candidatesFor({
      today,
      courseDay: day ? { number: day.day_number, title: day.title, minutes: day.minutes, slug } : null,
      courseDayDone: dayDone,
      mealsLogged: nutrition.loggedMeals.length,
      habits: habits.map((h) => ({ id: h.id, title: h.title, anchor: h.anchor, doneToday: loggedHabitIds.has(h.id) })),
      daysSinceWeighIn: since(lastWeigh),
      hasPrompt: Boolean(prompt),
      promptAnswered: Boolean(promptEntry),
      /*
       * Nothing here that she cannot open.
       *
       * Protocols, Studio and Wardrobe are part of The Circle now, so
       * offering "tonight is your retinal" or "two o'clock: edit the video"
       * to a free member is an invitation to a locked door. The moment card
       * is the one surface that promises she can act on what it says.
       */
      tonight: access.paid ? tonight : null,
      tonightDone,
      wash: access.paid ? wash : null,
      washedToday,
      studioToday: access.paid ? studioToday : [],
      outfit: access.paid ? outfit : null,
    }),
  })

  /*
   * No early return for someone without a course.
   *
   * This page used to bail out entirely — a heading, a button, and nothing
   * else — for anyone who had not started a programme. Which is every new
   * member, and every paid member who switches a course off. The free tier
   * is sold as the daily prompt, the journal, food and body logging, and all
   * of it was invisible behind a button to a locked door.
   *
   * The programme is one row among several now, not the price of entry.
   */
  const hasCourse = Boolean(enrollment && currentDay && course)

  return (
    <div className="flex flex-col gap-6">
      <header className="honey-glow -mx-5 -mt-6 px-5 pb-4 pt-6">
        <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          {new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        {/* It said "Morning" at eleven at night. It knows the hour now. */}
        <h1 className="mt-1 font-serif text-[29px] font-semibold leading-[1.1]">
          {profile?.name ? greetingFor(hour, profile.name.split(' ')[0]) : greetingFor(hour, null)}
        </h1>
      </header>

      {/*
        The state headline is NOT on this page, and that is deliberate.

        Today already makes more database round trips than any other page in
        the app, and `getPersonalState` adds eighteen more — on a function
        with a ten second ceiling. It tipped over: `/app` began returning Bad
        Gateway while every other route stayed at 200, because every other
        route does a fraction of this work.

        It was the wrong trade regardless. The headline fires rarely by
        design, so this was eighteen queries on every load of the most-visited
        page in order to say nothing on almost all of them. The full reading
        lives on You, where it is the point of the page rather than a garnish.
      */}
      <NoticeLine notice={notice} />

      {/*
        This moment, then everything behind it.

        The flat checklist and the hourly nudge strip both came out — the
        moment card is doing both jobs, and doing them with each engine's own
        reasoning rather than a generic line. Everything that used to sit
        above it — four counters, a progress bar, a course switcher — answers
        "how am I doing" when she opened the app to ask "what now".
      */}
      <MomentCard moment={moment} hour={hour} />

      {/*
        The check-in, in place, directly under the moment card.

        62 meals logged against 5 check-ins. Meal logging is the one thing
        that was made reachable without leaving this page, and it is the one
        thing that got used. The check-in was still a card that sent her to
        another page — the exact shape meal logging had before it was fixed.
        Everything the app is trying to become is built on these three
        numbers, so the taps happening matters more than any engine behind
        them.
      */}
      <CheckinInline existing={checkin ? { energy: checkin.energy, sleep_quality: checkin.sleep_quality, stress: checkin.stress } : null} />

      {/*
        Three cards that existed and were reachable from nowhere.
        Each one belongs to a time rather than a page, which is what Today is
        for — the moment engine already decides the hour, so these follow it.

        ResetPanel decides for itself: it asks how long she has been away and
        stays hidden unless there is a real gap. That is the right behaviour
        for a card about coming back, so it is mounted unconditionally and
        trusted to keep quiet.
      */}
      <ResetPanel />
      {hour >= 5 && hour < 12 && <MorningResetCard existing={morning} />}
      {hour >= 19 && <EveningReflectionCard existing={evening} />}

      {/*
        Everything below here asks her to take something ON.
        
        Start a program, add a habit, set a baseline, and the counters and
        progress bar that invite a comparison. All reasonable on a day with
        room in it. On a stretched day they are a list of ways she is not
        doing enough, handed to a woman who has already told the app she is
        running on empty.
        
        `computeCapacity` exists precisely to tell "she does not want it
        enough" apart from "her life has no room", and until now nothing in
        the app changed when it answered. This is that answer being acted on:
        the honest response to no room is subtraction. See rule 3 in
        CONSCIOUSNESS.md.
        
        Null capacity means the app has not been told — which is not the same
        as stretched, and gets the ordinary page.
      */}
      {capacity === 'stretched' ? (
        <p className="rounded-2xl bg-secondary/60 px-4 py-3 text-[14px] leading-[1.5] text-pretty text-muted-foreground">
          There is a lot on you this week, so the rest of today is put away.
          It is all still here when you want it.
        </p>
      ) : (
      <>
      {!hasCourse && (
        <Link
          href="/app/program"
          className="flex items-center gap-3 rounded-2xl border border-dashed border-border bg-card px-4 py-4"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-semibold">Start a program</span>
            <span className="mt-0.5 block text-[13px] text-muted-foreground text-pretty">
              four of them. you can carry more than one, or none.
            </span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Link>
      )}

      {!baseline && <BaselineCardLink dayNumber={currentDay} />}

      <QuickAddHabit suggestions={habitSuggestions} />

      {hasCourse && (
      <section className="grid grid-cols-4 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card px-2 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">{s.label}</p>
            <p className="mt-1 flex items-center justify-center gap-0.5 font-serif text-[22px] font-semibold leading-none">
              {s.flame && <Flame className="h-3.5 w-3.5 text-primary" />}
              {s.value}
            </p>
            <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{s.sub}</p>
          </div>
        ))}
      </section>
      )}

      {hasCourse && course && (
      <section>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          {completedDays.length} of {course.length_days} days · week {weekOfDay(course, currentDay!)} of {course.weeks}
        </p>
      </section>
      )}

      </>
      )}

      {/*
        Her pillars stay on a stretched day, deliberately.
        
        Everything above asks something of her. This is the one link that
        offers her something instead — what she said matters, and what is held
        under it. That is the thing a woman with nothing left should still be
        able to reach.
      */}
      <Link href="/app/becoming" className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold">Your pillars</span>
          <span className="mt-0.5 block text-[13px] text-muted-foreground">what matters to you, and what&rsquo;s held there</span>
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      </Link>
    </div>
  )
}
