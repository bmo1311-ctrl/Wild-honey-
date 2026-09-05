'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Bookmark, ExternalLink, Search, X } from 'lucide-react'
import { VAULT_TABS, type VaultItem, type VaultKind } from '@/lib/vault'
import { PILLAR_META, PILLARS } from '@/lib/pillars'
import type { Pillar } from '@/lib/types'
import { cn } from '@/lib/utils'

const KIND_LABEL: Record<VaultKind, string> = { resource: 'read', recipe: 'cook', workout: 'move', day: 'course' }

/**
 * One search across everything: resources, recipes, workouts and all 56
 * course days. Filtering happens here rather than on the server — the whole
 * index is a couple of hundred items, so results are instant as she types.
 */
export function VaultBrowser({ items }: { items: VaultItem[] }) {
  const [q, setQ] = useState('')
  const [tab, setTab] = useState<(typeof VAULT_TABS)[number]['key']>('all')
  const [pillar, setPillar] = useState<Pillar | null>(null)

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const terms = needle.split(/\s+/).filter(Boolean)
    return items.filter((it) => {
      if (tab === 'saved' && !it.saved) return false
      if (tab !== 'all' && tab !== 'saved' && it.kind !== tab) return false
      if (pillar && it.pillar !== pillar) return false
      return terms.every((t) => it.search.includes(t))
    })
  }, [items, q, tab, pillar])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length, saved: items.filter((i) => i.saved).length }
    for (const k of ['resource', 'recipe', 'workout', 'day'] as VaultKind[]) c[k] = items.filter((i) => i.kind === k).length
    return c
  }, [items])

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          type="search"
          inputMode="search"
          placeholder="Search everything…"
          aria-label="Search the vault"
          className="h-12 w-full rounded-2xl bg-card pl-9 pr-9 text-base outline-none ring-1 ring-border focus-visible:ring-2 focus-visible:ring-primary/40"
        />
        {q && (
          <button type="button" onClick={() => setQ('')} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
        {VAULT_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              'shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
              tab === t.key ? 'bg-mindset-pillar text-white' : 'bg-muted text-muted-foreground',
            )}
          >
            {t.label}
            <span className="ml-1.5 opacity-70">{counts[t.key] ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
        {PILLARS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPillar(pillar === p ? null : p)}
            className={cn(
              'shrink-0 rounded-full px-3 py-1 text-xs font-medium ring-1 transition-colors',
              pillar === p ? 'text-white ring-transparent' : 'bg-card text-muted-foreground ring-border',
            )}
            style={pillar === p ? { backgroundColor: `var(--pillar-${p.toLowerCase()})` } : undefined}
          >
            {PILLAR_META[p].label}
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        {results.length} {results.length === 1 ? 'result' : 'results'}
        {q && ` for “${q.trim()}”`}
      </p>

      {results.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <p className="text-[15px] text-muted-foreground text-pretty">
            Nothing matches that yet. Try a shorter word, or clear the filters.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {results.map((it) => {
            const body = (
              <>
                <span className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{KIND_LABEL[it.kind]}</span>
                  {it.pillar && (
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: `var(--pillar-${it.pillar.toLowerCase()})` }}
                      aria-hidden="true"
                    />
                  )}
                  <span className="truncate text-[11px] text-muted-foreground">{it.meta}</span>
                  {it.saved && <Bookmark className="ml-auto h-3.5 w-3.5 shrink-0 fill-current text-mindset-pillar" />}
                </span>
                <span className="mt-1 block text-[15px] font-semibold leading-snug text-pretty">{it.title}</span>
                {it.description && <span className="mt-0.5 block line-clamp-2 text-[13px] leading-[1.45] text-muted-foreground">{it.description}</span>}
              </>
            )
            return (
              <li key={`${it.kind}-${it.id}`}>
                {it.external ? (
                  <a href={it.href} target="_blank" rel="noopener noreferrer" className="block rounded-2xl border border-border bg-card p-4">
                    {body}
                    <span className="mt-2 flex items-center gap-1 text-xs font-medium text-mindset-pillar">
                      Open <ExternalLink className="h-3 w-3" />
                    </span>
                  </a>
                ) : (
                  <Link href={it.href} className="block rounded-2xl border border-border bg-card p-4">
                    {body}
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
