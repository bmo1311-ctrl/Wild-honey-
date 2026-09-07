import Link from 'next/link'
import { cn } from '@/lib/utils'

/**
 * Two or three views of the same thing, under one door.
 *
 * Becoming and Evolution were separate tiles showing overlapping evidence of
 * the same change; Archive was a tile showing a subset of what Write already
 * held. Three doors into one room is not more room, it is a longer corridor.
 *
 * The tab lives in the URL, so back works and a link lands where it says.
 */
export function PageTabs({
  tabs,
  active,
}: {
  tabs: { key: string; label: string; href: string }[]
  active: string
}) {
  return (
    <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          className={cn(
            'shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors',
            t.key === active ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground',
          )}
        >
          {t.label}
        </Link>
      ))}
    </div>
  )
}
