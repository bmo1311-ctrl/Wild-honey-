'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { Pause, Play } from 'lucide-react'
import { resumeCourse, unenrollFromCourse } from '@/app/actions'

/**
 * Switch a course on or off.
 *
 * Off is not quitting and never says so. Her days stay done, her writing
 * stays written, and the start date shifts by however long she is away, so
 * coming back lands her on the day she left rather than the day the calendar
 * reached. Nothing here counts against her for setting something down.
 */
export function CourseToggle({ slug, active }: { slug: string; active: boolean }) {
  const [pending, startTransition] = useTransition()

  function flip() {
    startTransition(async () => {
      const res = active ? await unenrollFromCourse(slug) : await resumeCourse(slug)
      if (res && 'error' in res && res.error) {
        toast.error(res.error)
        return
      }
      toast.success(active ? 'Switched off. Your progress is kept.' : 'Back on, where you left it.')
    })
  }

  return (
    <button
      type="button"
      onClick={flip}
      disabled={pending}
      className="flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground"
    >
      {active ? (
        <>
          <Pause className="h-3 w-3" />
          switch off
        </>
      ) : (
        <>
          <Play className="h-3 w-3" />
          switch on
        </>
      )}
    </button>
  )
}
