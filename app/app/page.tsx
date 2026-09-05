import { Flame } from 'lucide-react'
import { DayView } from '@/components/course/day-view'
import { COURSE, getDay } from '@/lib/courses'
import type { CourseWriting } from '@/lib/courses'
import { getCourseState, getSessionProfile, getTodayCheckin, getWritings } from '@/lib/data'
import { StartCourseButton } from '@/components/course/start-course-button'

/**
 * Today shows today. If she is enrolled it renders the day inline, identical
 * to the day view, with no extra navigation — two taps from lock screen to
 * done. Morning reset, evening reflection, prompt-of-the-day, goals and the
 * focus card are deliberately not here any more.
 */
export default async function TodayPage() {
  const [{ enrollment, currentDay, completedDays }, profile] = await Promise.all([getCourseState(), getSessionProfile()])

  if (!enrollment || currentDay === null) {
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

  const day = getDay(currentDay)
  if (!day) return null

  const [writings, checkin] = await Promise.all([getWritings(currentDay), getTodayCheckin()])
  const saved = new Map<number, CourseWriting>(writings.map((w) => [w.prompt_index, w]))
  const pct = Math.round((completedDays.length / COURSE.length_days) * 100)

  return (
    <div className="flex flex-col gap-5">
      {/* Progress is visible on every screen, so Program is for browsing, not orientation. */}
      <div className="-mx-5 -mt-5 overflow-hidden bg-mindset-pillar">
        <div className="flex items-center justify-between px-5 py-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white">
            Day {currentDay} of {COURSE.length_days}
          </p>
          {profile?.streak_count ? (
            <p className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.14em] text-white">
              <Flame className="h-3.5 w-3.5" />
              {profile.streak_count}
            </p>
          ) : null}
        </div>
        <div className="h-[5px] w-full bg-[#0d2c53]">
          <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <DayView
        day={day}
        saved={saved}
        checkin={checkin}
        done={completedDays.includes(currentDay)}
        doneAt={null}
        showNav={false}
      />
    </div>
  )
}
