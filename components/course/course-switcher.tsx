import Link from 'next/link'
import { loadCourses } from '@/lib/courses-db'
import { cn } from '@/lib/utils'

/** Shown only when she holds more than one course. One tap changes what Today is about. */
export async function CourseSwitcher({ current, others }: { current: string; others: string[] }) {
  const all = [current, ...others]
  const courses = await loadCourses()
  return (
    <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
      {all.map((slug) => {
        const c = courses.find((x) => x.slug === slug)
        if (!c) return null
        const active = slug === current
        return (
          <Link
            key={slug}
            href={active ? '/app' : `/app?course=${slug}`}
            className={cn(
              'shrink-0 rounded-full px-3.5 py-2 text-sm font-medium transition-colors',
              active ? 'bg-mindset-pillar text-white' : 'bg-muted text-muted-foreground',
            )}
          >
            {c.title}
          </Link>
        )
      })}
    </div>
  )
}
