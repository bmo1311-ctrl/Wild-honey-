'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { enrollInCourse } from '@/app/actions'

/** Creates the enrollment with started_on = today, then drops her into day 1. */
export function StartCourseButton({ slug, label = 'Begin day 1' }: { slug?: string; label?: string }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await enrollInCourse(slug)
          if ('error' in res && res.error) {
            toast.error(res.error)
            return
          }
          router.refresh()
        })
      }
      className="mt-4 h-[58px] w-full rounded-2xl bg-primary text-[18px] font-bold text-primary-foreground disabled:opacity-60"
    >
      {pending ? 'Starting…' : label}
    </button>
  )
}
