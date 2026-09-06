'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { AREAS } from '@/lib/domains'
import { cn } from '@/lib/utils'

/**
 * The menu bar across the top of Protocols.
 *
 * Links rather than state, so the choice lives in the URL: the back button
 * works, a tab survives a refresh, and she can send someone straight to
 * Resets. Nothing to load, nothing to flicker.
 */
export function ProtocolNav({ active, counts }: { active: string; counts: Record<string, number> }) {
  const pathname = usePathname()
  const params = useSearchParams()

  return (
    <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
      {AREAS.map((area) => {
        const next = new URLSearchParams(params.toString())
        next.set('area', area.key)
        const isActive = active === area.key
        const count = counts[area.key] ?? 0
        return (
          <Link
            key={area.key}
            href={`${pathname}?${next.toString()}`}
            scroll={false}
            className={cn(
              'shrink-0 rounded-full px-3.5 py-2 text-sm font-medium transition-colors',
              isActive ? 'bg-mindset-pillar text-white' : 'bg-muted text-muted-foreground',
            )}
          >
            {area.label}
            {count > 0 && <span className="ml-1.5 opacity-70">{count}</span>}
          </Link>
        )
      })}
    </div>
  )
}
