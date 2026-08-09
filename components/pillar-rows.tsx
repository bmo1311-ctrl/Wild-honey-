'use client'

import { useMemo, useRef, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Pillar } from '@/lib/types'
import { PILLARS } from '@/lib/pillars'
import { cn } from '@/lib/utils'

type WithPillar = { id: string; pillar: Pillar | null }

/** Fisher-Yates shuffle — doesn't mutate the input. */
export function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function Row<T extends WithPillar>({
  label,
  items,
  renderItem,
  cardWidthClass,
}: {
  label: string
  items: T[]
  renderItem: (item: T) => ReactNode
  cardWidthClass: string
}) {
  const scrollerRef = useRef<HTMLDivElement>(null)

  function scrollBy(direction: 1 | -1) {
    const el = scrollerRef.current
    if (!el) return
    el.scrollBy({ left: direction * (el.clientWidth * 0.8), behavior: 'smooth' })
  }

  if (items.length === 0) return null

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-lg font-semibold lowercase">{label}</h2>
        <div className="hidden gap-1 sm:flex">
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            aria-label={`scroll ${label} left`}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-secondary-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            aria-label={`scroll ${label} right`}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-secondary-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div
        ref={scrollerRef}
        className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => (
          <div key={item.id} className={cn('shrink-0 snap-start', cardWidthClass)}>
            {renderItem(item)}
          </div>
        ))}
      </div>
    </section>
  )
}

/**
 * Netflix-style browse: filter chips on top, then one horizontally
 * scrolling row per pillar. Selecting a pillar collapses to that row only.
 */
export function PillarRows<T extends WithPillar>({
  items,
  renderItem,
  extraFilter,
  emptyMessage = 'nothing here yet — check back soon.',
  cardWidthClass = 'w-[240px]',
}: {
  items: T[]
  renderItem: (item: T) => ReactNode
  extraFilter?: { label: string; icon?: ReactNode; predicate: (item: T) => boolean }
  emptyMessage?: string
  cardWidthClass?: string
}) {
  const [pillarFilter, setPillarFilter] = useState<Pillar | null>(null)
  const [extraOn, setExtraOn] = useState(false)

  // Shuffle once per mount (page load), not on every filter click, so the
  // order doesn't jump around while someone's tapping through pillar chips.
  const shuffledItems = useMemo(() => shuffle(items), [items])

  const base = extraOn && extraFilter ? shuffledItems.filter(extraFilter.predicate) : shuffledItems
  const visiblePillars = pillarFilter ? [pillarFilter] : PILLARS
  const unassigned = base.filter((i) => !i.pillar)

  const hasAnything = base.length > 0

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setPillarFilter(null)}
          className={cn(
            'rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-border transition-colors',
            !pillarFilter ? 'bg-foreground text-background ring-foreground' : 'bg-transparent text-muted-foreground',
          )}
        >
          all
        </button>
        {PILLARS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPillarFilter(pillarFilter === p ? null : p)}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-border transition-colors',
              pillarFilter === p ? 'bg-foreground text-background ring-foreground' : 'bg-transparent text-muted-foreground',
            )}
          >
            {p}
          </button>
        ))}
        {extraFilter && (
          <button
            type="button"
            onClick={() => setExtraOn((s) => !s)}
            className={cn(
              'flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-border transition-colors',
              extraOn ? 'bg-honey text-honey-foreground ring-honey' : 'bg-transparent text-muted-foreground',
            )}
          >
            {extraFilter.icon}
            {extraFilter.label}
          </button>
        )}
      </div>

      {!hasAnything ? (
        <p className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground ring-1 ring-border">{emptyMessage}</p>
      ) : (
        <div className="flex flex-col gap-7">
          {visiblePillars.map((p) => (
            <Row
              key={p}
              label={p}
              items={base.filter((i) => i.pillar === p)}
              renderItem={renderItem}
              cardWidthClass={cardWidthClass}
            />
          ))}
          {!pillarFilter && unassigned.length > 0 && (
            <Row label="more" items={unassigned} renderItem={renderItem} cardWidthClass={cardWidthClass} />
          )}
        </div>
      )}
    </div>
  )
}
