'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { saveCourseMeta } from '@/app/actions'
import { cn } from '@/lib/utils'

/**
 * Visible to members, or not.
 *
 * Hiding a course removes it from Programs and from Today without touching a
 * word of it, so she can rewrite one in place instead of editing something
 * women are part-way through reading. Anyone already enrolled keeps their
 * progress — this only decides what is offered.
 */
export function CoursePublishToggle({ slug, published }: { slug: string; published: boolean }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [on, setOn] = useState(published)

  function toggle() {
    const next = !on
    setOn(next)
    start(async () => {
      const res = await saveCourseMeta(slug, { published: next })
      if (res && 'error' in res && res.error) {
        setOn(!next)
        toast.error(res.error)
        return
      }
      toast.success(next ? 'Visible to members.' : 'Hidden from members.')
      router.refresh()
    })
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className="flex w-full items-center gap-2.5 text-left disabled:opacity-50"
    >
      <span
        className={cn(
          'flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors',
          on ? 'bg-foreground' : 'bg-muted-foreground/30',
        )}
      >
        <span className={cn('h-4 w-4 rounded-full bg-background transition-transform', on && 'translate-x-4')} />
      </span>
      <span className="text-[13px] font-medium">
        {on ? 'visible to members' : 'hidden — only you can see it'}
      </span>
    </button>
  )
}
