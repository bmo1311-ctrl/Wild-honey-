import Link from 'next/link'
import { ChevronRight, Flame } from 'lucide-react'
import { TodayChecklist, type TodoRow } from '@/components/today-checklist'
import { StartCourseButton } from '@/components/course/start-course-button'
import { COURSE, getDay, toISODate } from '@/lib/courses'
import { computeStreaks } from '@/lib/rewards'
import {
  getCourseState,
  getDayProgress,
  getHabits,
  getRecentHabitLogs,
  getSessionProfile,
  getTodayCheckin,
  getTodayNutrition,
} from '@/lib/data'

/**
 * The dashboard. Stats she has earned at the top, then one plain list of what
 * today actually needs — tickable where it can be ticked, and a link straight
 * to the work where it can't.
 */
export default async function TodayPage() {
  const [{ enrollment, currentDay, completedDays }, profile, progress, checkin, nutrition, habits, habitLogs] = await Promise.all([
    getCourseState(),
    getSessionProfile(),
    getDayProgress(),
    getTodayCheckin(),
    getTodayNutrition(),
    getHabits(),
    getRecentHabitLogs(7),
  ])

  const streaks = computeStreaks(progress)
  const today = toISODate()
  const day = currentDay ? getDay(currentDay) : null
  const dayDone = currentDay ? completedDays.includes(currentDay) : false
  const pct = Math.round((completedDays.length / COURSE.length_days) * 100)
  const loggedHabitIds = new Set(habitLogs.filter((l) => l.date === today).map((l) => l.habit_id))

  const stats = [
    { label: 'Day', value: currentDay ? `${currentDay}` : '—', sub: `of ${COURSE.length_days}` },
    { label: 'Streak', value: `${streaks.current}`, sub: streaks.longest > streaks.current ? `best ${streaks.longest}` : 'days', flame: true },
    { label: 'Done', value: `${completedDays.length}`, sub: `${pct}%` },
    {
      label: 'Protein',
      value: nutrition.protein ? `${Math.round(nutrition.protein)}` : '0',
      sub: nutrition.proteinGoal ? `of ${nutrition.proteinGoal}g` : 'g today',
    },
  ]

  const rows: TodoRow[] = []
  if (day) {
    rows.push({
      key: 'course',
      kind: 'course',
      id: String(day.day_number),
      label: `Day ${day.day_number} · ${day.title}`,
      hint: `${day.kind} · ${day.minutes} min`,
      done: dayDone,
    })
  }
  rows.push({
    key: 'checkin',
    kind: 'link',
    href: '/app/nutrition',
    label: 'Log how you feel',
    hint: checkin ? 'logged today' : 'energy, sleep, stress',
    done: Boolean(checkin),
  })
  rows.push({
    key: 'meals',
    kind: 'link',
    href: '/app/nutrition',
    label: 'Log what you ate',
    hint: nutrition.loggedMeals.length ? `${nutrition.loggedMeals.length} logged` : 'nothing logged yet',
    done: nutrition.loggedMeals.length > 0,
  })
  for (const h of habits) {
    rows.push({ key: `habit-${h.id}`, kind: 'habit', id: h.id, label: h.title, hint: h.anchor ?? undefined, done: loggedHabitIds.has(h.id) })
  }

  if (!enrollment || !currentDay) {
    return (
      <div className="flex flex-col gap-6">
        <header>
          <h1 className="font-serif text-[29px] font-semibold leading-[1.1] text-balance">{COURSE.title}</h1>
          <p className="mt-2 text-[16.5px] leading-[1.5] text-pretty text-muted-foreground">{COURSE.subtitle}</p>
        </header>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="font-serif text-xl font-semibold">Eight weeks. Fifty-six days.</p>
          <p className="mt-1.5 text-[15px] leading-[1.5] text-pretty text-muted-foreground">
            Thirty minutes of intentional practice a day. Today becomes day one.
          </p>
          <StartCourseButton />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          {new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        <h1 className="mt-1 font-serif text-[29px] font-semibold leading-[1.1]">
          {profile?.name ? `Morning, ${profile.name.split(' ')[0]}` : 'Today'}
        </h1>
      </header>

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

      <section>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          {completedDays.length} of {COURSE.length_days} days · week {Math.floor((currentDay - 1) / 7) + 1} of {COURSE.weeks}
        </p>
      </section>

      <TodayChecklist rows={rows} />

      {day && (
        <Link
          href={`/app/program/day/${day.day_number}`}
          className="flex h-[58px] items-center justify-center gap-1.5 rounded-2xl bg-primary text-[18px] font-bold text-primary-foreground"
        >
          Open day {day.day_number}
          <ChevronRight className="h-5 w-5" />
        </Link>
      )}

      <Link href="/app/becoming" className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold">Your becoming</span>
          <span className="mt-0.5 block text-[13px] text-muted-foreground">what&rsquo;s changed since you started</span>
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      </Link>
    </div>
  )
}
