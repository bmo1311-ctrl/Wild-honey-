import Link from 'next/link'
import { Check, Flame, Lock } from 'lucide-react'
import { getCourse, currentDayFrom, weekOfDay } from '@/lib/courses'
import { computeBecoming, computeMilestones, computeStreaks } from '@/lib/rewards'
import { getActiveCourseState, getBaselineVitality, getDayProgress, getLatestVitalityCheckin, getWritings } from '@/lib/data'
import { VITALITY_DIMENSIONS } from '@/lib/honey-profile'
import { PILLAR_META } from '@/lib/pillars'
import { cn } from '@/lib/utils'

/**
 * Evidence of change, drawn from what she has already done. Nothing here is a
 * score, nothing is compared to another member, and a gap is never scolded.
 */
export default async function BecomingPage() {
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
  const ratings = writings
    .filter((w) => w.kind === 'rate' && Number(w.body))
    .map((w) => ({ day_number: w.day_number, value: Number(w.body) }))

  const course = getCourse(active.slug)
  const currentDay = active.enrollment && course ? currentDayFrom(course, active.enrollment.started_on) : 0
  const weeksReached = currentDay && course ? weekOfDay(course, currentDay) : 0

  const streaks = computeStreaks(progress)
  const { earned, next, all } = computeMilestones(progress, writingCount)
  const pillars = computeBecoming({
    completedDays: progress.map((p) => p.day_number),
    writingCount,
    ratings,
    weeksReached,
  })

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-serif text-[29px] font-semibold leading-[1.1]">Your becoming</h1>
        <p className="mt-1.5 text-[15px] leading-[1.5] text-pretty text-muted-foreground">
          what you&rsquo;ve actually done, in your own words and numbers.
        </p>
      </header>

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

      <section className="flex flex-col gap-2.5">
        {pillars.map((p) => {
          const meta = PILLAR_META[p.pillar]
          const pct = p.total ? Math.round((p.value / p.total) * 100) : 0
          return (
            <div key={p.pillar} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: `var(--pillar-${p.pillar.toLowerCase()})` }}
                  aria-hidden="true"
                />
                <p className="font-serif text-[17px] font-semibold">{meta.label}</p>
                <p className="ml-auto text-sm font-medium text-muted-foreground">{p.headline}</p>
              </div>
              <div className="mt-3 h-[7px] w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: `var(--pillar-${p.pillar.toLowerCase()})` }}
                />
              </div>
              <p className="mt-2.5 text-[14.5px] leading-[1.45] text-pretty text-muted-foreground">{p.evidence}</p>
            </div>
          )
        })}
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

      <Link href="/app/program" className="text-center text-sm font-medium text-mindset-pillar underline underline-offset-[3px]">
        Back to the program
      </Link>
    </div>
  )
}
