import Link from 'next/link'
import { Check, Flame, Lock } from 'lucide-react'
import { currentDayFrom, weekOfDay } from '@/lib/courses'
import { loadCourse } from '@/lib/courses-db'
import { localToday, localTimeZone } from '@/lib/today'
import { computeMilestones, computeStreaks } from '@/lib/rewards'
import { getActiveCourseState, getBaselineVitality, getDayProgress, getLatestVitalityCheckin, getWritings } from '@/lib/data'
import { VITALITY_DIMENSIONS } from '@/lib/honey-profile'
import { PillarShelf } from '@/components/pillar-shelf'
import { getShelves } from '@/lib/shelf-db'
import { getPersonalState } from '@/lib/personal-state-db'
import { DAY_NOTE } from '@/lib/shelf'
import type { CapacityLevel } from '@/lib/personal-state'
import { cn } from '@/lib/utils'
import { PageTabs } from '@/components/page-tabs'
import ProgressPage from '@/app/app/progress/page'
import { adultsOnly } from '@/lib/kid-guard'

/**
 * Evidence of change, drawn from what she has already done. Nothing here is a
 * score, nothing is compared to another member, and a gap is never scolded.
 */
/** Becoming and Evolution are two views of the same change. */
function BecomingTabs({ active }: { active: string }) {
  return (
    <PageTabs
      active={active}
      tabs={[
        { key: 'becoming', label: 'becoming', href: '/app/becoming' },
        { key: 'evolution', label: 'evolution', href: '/app/becoming?tab=evolution' },
      ]}
    />
  )
}

export default async function BecomingPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await adultsOnly()
  const { tab } = await searchParams
  const activeTab = tab === 'evolution' ? 'evolution' : 'becoming'
  if (activeTab === 'evolution') {
    return (
      <div className="flex flex-col gap-6">
        <BecomingTabs active={activeTab} />
        <ProgressPage />
      </div>
    )
  }

  // Which course first, so progress and writing are read for that course, not the default.
  const active = await getActiveCourseState()
  const [progress, writings, baseline, latest] = await Promise.all([
    getDayProgress(active.slug),
    getWritings(undefined, active.slug),
    getBaselineVitality(),
    getLatestVitalityCheckin(),
  ])

  // Only a comparison if the two snapshots are actually different check-ins.
  const compare =
    baseline && latest && latest.id !== baseline.id
      ? VITALITY_DIMENSIONS.map((d) => {
          const before = (baseline as unknown as Record<string, number | null>)[d.key]
          const now = (latest as unknown as Record<string, number | null>)[d.key]
          return typeof before === 'number' && typeof now === 'number' ? { label: d.label, before, now } : null
        }).filter((x): x is { label: string; before: number; now: number } => x !== null)
      : []

  const writingCount = writings.filter((w) => w.kind === 'write' && w.body.trim()).length
  const course = await loadCourse(active.slug)

  /*
   * `ratings`, `currentDay` and `weeksReached` were computed here and handed
   * to `computeBecoming`, which turned them into the Identity and Faith
   * progress bars. Both are gone, so these are too rather than left running.
   */

  /*
   * The course she is actually on.
   *
   * `lib/rewards.ts` used to read Strong and Surrendered's 56 days and 8
   * weeks for everyone, while this page has always loaded `active.slug`. On
   * Daily Bread that read "28 of 56 days" at the finish line.
   */
  const shape = course
    ? { title: course.title, lengthDays: course.length_days, weeks: course.weeks }
    : undefined

  // Her days, not the server's — see computeStreaks.
  const [streakToday, timeZone] = await Promise.all([localToday(), localTimeZone()])
  const streaks = computeStreaks(progress, { today: streakToday, timeZone })
  const { earned, next, all } = computeMilestones(progress, writingCount, shape)

  /*
   * The four pillars, as shelves rather than progress bars.
   *
   * `computeBecoming` used to turn them into course completion: Body was days
   * finished out of 56, Faith was "week 3 of 12". The pillars are Brooke's
   * coaching plan and they were being rendered as how far through a programme
   * a woman had got — with the empty part of each bar standing in for the
   * amount of Faith she was missing.
   *
   * The day's capacity decides how much is offered, not whether she deserves
   * it. See lib/shelf.ts.
   */
  const personal = await getPersonalState()
  // 'available' when there is not enough to say otherwise — the middle size,
  // which is the one that assumes least about her.
  const capacity: CapacityLevel = personal?.state.capacity.value ?? 'available'
  const shelves = await getShelves(capacity)

  /*
   * Nothing she has *done* yet — which is no longer a reason to show her an
   * empty page.
   *
   * This used to return early with "this page fills itself in" and a button
   * to choose a programme, because everything here was evidence of her own
   * activity and a woman on day one has none. That was right when the pillars
   * were progress bars.
   *
   * It is wrong now. The shelves hold Brooke's work, not hers: 105 questions
   * and 58 readings that are there before she does anything at all. A woman
   * who has just signed up is exactly who should be handed something to read
   * rather than a scoreboard explaining why it is empty. So the streaks,
   * milestones and then-and-now sections wait until there is something in
   * them, and the pillars do not wait for anything.
   */
  const nothingYet = !active.enrollment && progress.length === 0 && writingCount === 0

  return (
    <div className="flex flex-col gap-6">
      <header className="honey-glow -mx-5 -mt-6 px-5 pb-4 pt-6">
        <h1 className="font-serif text-[29px] font-semibold leading-[1.1]">Your becoming</h1>
        <p className="mt-1.5 text-[15px] leading-[1.5] text-pretty text-muted-foreground">
          your four pillars, and what&rsquo;s held in each.
        </p>
      </header>

      <BecomingTabs active="becoming" />

      {!nothingYet && (
      <section className="grid grid-cols-2 gap-2.5">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
            <Flame className="h-3.5 w-3.5" /> Current run
          </p>
          <p className="mt-1.5 font-serif text-[28px] font-semibold leading-none">{streaks.current}</p>
          <p className="mt-1 text-xs text-muted-foreground">{streaks.current === 1 ? 'day' : 'days'} in a row</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">Longest run</p>
          <p className="mt-1.5 font-serif text-[28px] font-semibold leading-none">{streaks.longest}</p>
          <p className="mt-1 text-xs text-muted-foreground">this one is yours to keep</p>
        </div>
      </section>
      )}

      <section className="flex flex-col gap-2.5">
        <p className="text-[14px] leading-[1.5] text-pretty text-muted-foreground">{DAY_NOTE[capacity]}</p>
        {shelves.map((shelf) => (
          <PillarShelf key={shelf.pillar} shelf={shelf} />
        ))}
      </section>

      {compare.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">Then and now</h2>
          <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
            {compare.map((c, i) => {
              const delta = c.now - c.before
              return (
                <div key={c.label} className={cn('flex items-center gap-3 px-4 py-3', i > 0 && 'border-t border-border')}>
                  <span className="min-w-0 flex-1 text-[15px] font-medium">{c.label}</span>
                  <span className="shrink-0 text-sm text-muted-foreground">
                    {c.before} &rarr; <span className="font-semibold text-foreground">{c.now}</span>
                  </span>
                  <span
                    className={cn(
                      'w-10 shrink-0 text-right text-sm font-semibold',
                      delta > 0 ? 'text-mindset-pillar' : delta < 0 ? 'text-primary' : 'text-muted-foreground',
                    )}
                  >
                    {delta > 0 ? '+' : ''}
                    {delta || '—'}
                  </span>
                </div>
              )
            })}
          </div>
          <p className="mt-2 text-[12.5px] text-muted-foreground">your own ratings, first against most recent.</p>
        </section>
      )}

      {/*
        Milestones wait until there is one.

        For a new member this rendered as "Milestones · 0 of 9" above nine
        padlocks — a list of everything she had not done yet, on her first
        visit. It is a nice section once something is on it.
      */}
      {!nothingYet && (
      <section>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
          Milestones · {earned.length} of {all.length}
        </h2>
        {next && (
          <p className="mb-2.5 rounded-xl bg-muted p-3 text-[14.5px] leading-[1.45] text-pretty">
            Next: <span className="font-semibold">{next.label}</span> — {next.detail}
          </p>
        )}
        <ul className="flex flex-col gap-2">
          {all.map((m) => (
            <li
              key={m.key}
              className={cn('flex items-start gap-3 rounded-2xl border p-3.5', m.earned ? 'border-border bg-card' : 'border-dashed border-border')}
            >
              <span
                className={cn(
                  'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                  m.earned ? 'bg-mindset-pillar text-white' : 'bg-muted text-muted-foreground',
                )}
              >
                {m.earned ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <Lock className="h-3 w-3" />}
              </span>
              <span className="min-w-0">
                <span className={cn('block text-[15px] font-semibold', !m.earned && 'text-muted-foreground')}>{m.label}</span>
                <span className="mt-0.5 block text-[13px] leading-[1.45] text-pretty text-muted-foreground">{m.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
      )}

      <Link href="/app/program" className="text-center text-sm font-medium text-mindset-pillar underline underline-offset-[3px]">
        {nothingYet ? 'Choose a program' : 'Back to the program'}
      </Link>
    </div>
  )
}
