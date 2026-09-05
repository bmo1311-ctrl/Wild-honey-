import Link from 'next/link'
import { ChevronRight, Flame } from 'lucide-react'
import { TodayChecklist } from '@/components/today-checklist'
import { BaselineCard } from '@/components/baseline-card'
import { todayRows } from '@/lib/modules'
import { getCourse, getDay, toISODate, weekOfDay } from '@/lib/courses'
import { computeStreaks } from '@/lib/rewards'
import {
  getActiveCourseState,
  getDayProgress,
  getHabits,
  getRecentHabitLogs,
  getBaselineVitality,
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
  const [{ slug, enrollment, currentDay, completedDays }, profile, progress, checkin, nutrition, habits, habitLogs] = await Promise.all([
    getActiveCourseState(),
    getSessionProfile(),
    getDayProgress(),
    getTodayCheckin(),
    getTodayNutrition(),
    getHabits(),
    getRecentHabitLogs(7),
  ])
  const baseline = await getBaselineVitality()

  const course = getCourse(slug)
  const streaks = computeStreaks(progress)
  const today = toISODate()
  const day = course && currentDay ? getDay(course, currentDay) : null
  const dayDone = currentDay ? completedDays.includes(currentDay) : false
  const pct = course ? Math.round((completedDays.length / course.length_days) * 100) : 0
  const loggedHabitIds = new Set(habitLogs.filter((l) => l.date === today).map((l) => l.habit_id))

  const stats = [
    { label: 'Day', value: currentDay ? `${currentDay}` : '—', sub: course ? `of ${course.length_days}` : '' },
    { label: 'Streak', value: `${streaks.current}`, sub: streaks.longest > streaks.current ? `best ${streaks.longest}` : 'days', flame: true },
    { label: 'Done', value: `${completedDays.length}`, sub: `${pct}%` },
    {
      label: 'Protein',
      value: nutrition.protein ? `${Math.round(nutrition.protein)}` : '0',
      sub: nutrition.proteinGoal ? `of ${nutrition.proteinGoal}g` : 'g today',
    },
  ]

  const rows = todayRows({
    courseDay: day ? { number: day.day_number, title: day.title, kind: day.kind, minutes: day.minutes } : null,
    courseDayDone: dayDone,
    checkedInToday: Boolean(checkin),
    mealsLoggedToday: nutrition.loggedMeals.length,
    habits: habits.map((h) => ({ id: h.id, title: h.title, anchor: h.anchor, doneToday: loggedHabitIds.has(h.id) })),
  })

  if (!enrollment || !currentDay || !course) {
    return (
      <div className="flex flex-col gap-6">
        <header>
          <h1 className="font-serif text-[29px] font-semibold leading-[1.1] text-balance">Start a program</h1>
          <p className="mt-2 text-[16.5px] leading-[1.5] text-pretty text-muted-foreground">
            pick where you&rsquo;re beginning — you can carry more than one.
          </p>
        </header>
        <Link
          href="/app/program"
          className="flex h-[58px] items-center justify-center rounded-2xl bg-primary text-[18px] font-bold text-primary-foreground"
        >
          See the programs
        </Link>
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
          {completedDays.length} of {course.length_days} days · week {weekOfDay(course, currentDay)} of {course.weeks}
        </p>
      </section>

      {!baseline && <BaselineCard dayNumber={currentDay} />}

      <TodayChecklist rows={rows} />

      {day && (
        <Link
          href={`/app/program/${slug}/day/${day.day_number}`}
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
