'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Bookmark, ChevronRight, Play, Search, X } from 'lucide-react'
import { VaultPlayer } from '@/components/vault-player'
import type { VaultItem } from '@/lib/vault'
import { cn } from '@/lib/utils'

/**
 * Browse first, search second. The library is almost entirely video, so it is
 * laid out as shelves of artwork you scroll through — and a video plays in the
 * app rather than throwing you out to another tab.
 */
export function VaultBrowser({ shelves, all }: { shelves: { title: string; items: VaultItem[] }[]; all: VaultItem[] }) {
  const [playing, setPlaying] = useState<VaultItem | null>(null)
  const [q, setQ] = useState('')
  const [searching, setSearching] = useState(false)

  const results = useMemo(() => {
    const terms = q.trim().toLowerCase().split(/\s+/).filter(Boolean)
    if (!terms.length) return []
    return all.filter((it) => terms.every((t) => it.search.includes(t)))
  }, [all, q])

  const featured = shelves[0]?.items[0]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        {searching ? (
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              type="search"
              placeholder="Search the vault…"
              aria-label="Search the vault"
              className="h-11 w-full rounded-full bg-card pl-9 pr-3 text-base outline-none ring-1 ring-border focus-visible:ring-2 focus-visible:ring-primary/40"
            />
          </div>
        ) : (
          <p className="flex-1 text-sm text-muted-foreground">{all.length} things to watch, cook and move to</p>
        )}
        <button
          type="button"
          onClick={() => {
            setSearching((v) => !v)
            setQ('')
          }}
          aria-label={searching ? 'Close search' : 'Search'}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-card ring-1 ring-border"
        >
          {searching ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
        </button>
      </div>

      {searching && q.trim() ? (
        <section>
          <p className="mb-2 text-xs text-muted-foreground">
            {results.length} {results.length === 1 ? 'result' : 'results'}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {results.map((it) => (
              <Poster key={`${it.kind}-${it.id}`} item={it} onPlay={setPlaying} wide />
            ))}
          </div>
        </section>
      ) : (
        <>
          {featured && <Featured item={featured} onPlay={setPlaying} />}
          {shelves.map((shelf) =>
            shelf.items.length ? <Shelf key={shelf.title} title={shelf.title} items={shelf.items} onPlay={setPlaying} /> : null,
          )}
        </>
      )}

      {playing?.videoId && (
        <VaultPlayer
          videoId={playing.videoId}
          title={playing.title}
          description={playing.description}
          onClose={() => setPlaying(null)}
        />
      )}
    </div>
  )
}

function Featured({ item, onPlay }: { item: VaultItem; onPlay: (i: VaultItem) => void }) {
  return (
    <section>
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Start here</p>
      <button type="button" onClick={() => (item.videoId ? onPlay(item) : undefined)} className="w-full text-left">
        <span className="relative block aspect-video w-full overflow-hidden rounded-2xl bg-muted">
          {item.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.image} alt="" className="h-full w-full object-cover" loading="lazy" />
          ) : null}
          <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <span className="absolute bottom-3 left-3 right-3 flex items-end gap-3">
            <span className="min-w-0 flex-1">
              <span className="block font-serif text-[19px] font-semibold leading-snug text-white text-pretty">{item.title}</span>
              <span className="mt-0.5 block text-xs text-white/80">{item.meta}</span>
            </span>
            {item.videoId && (
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Play className="ml-0.5 h-5 w-5 fill-current" />
              </span>
            )}
          </span>
        </span>
      </button>
    </section>
  )
}

function Shelf({ title, items, onPlay }: { title: string; items: VaultItem[]; onPlay: (i: VaultItem) => void }) {
  return (
    <section>
      <h2 className="mb-2 flex items-center gap-1 font-serif text-[17px] font-semibold">
        {title}
        <span className="text-sm font-normal text-muted-foreground">· {items.length}</span>
      </h2>
      <div className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2">
        {items.map((it) => (
          <div key={`${it.kind}-${it.id}`} className="w-[62vw] max-w-[240px] shrink-0 snap-start">
            <Poster item={it} onPlay={onPlay} />
          </div>
        ))}
      </div>
    </section>
  )
}

function Poster({ item, onPlay, wide }: { item: VaultItem; onPlay: (i: VaultItem) => void; wide?: boolean }) {
  const art = (
    <>
      <span className={cn('relative block w-full overflow-hidden rounded-xl bg-muted', wide ? 'aspect-video' : 'aspect-video')}>
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <span
            className="flex h-full w-full items-center justify-center"
            style={item.pillar ? { backgroundColor: `color-mix(in oklch, var(--pillar-${item.pillar.toLowerCase()}), transparent 82%)` } : undefined}
          >
            <span className="px-2 text-center text-[11px] font-medium text-muted-foreground">{item.meta}</span>
          </span>
        )}
        {item.videoId && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-white">
              <Play className="ml-0.5 h-4 w-4 fill-current" />
            </span>
          </span>
        )}
        {item.saved && (
          <span className="absolute right-1.5 top-1.5 rounded-full bg-black/55 p-1.5 text-white">
            <Bookmark className="h-3 w-3 fill-current" />
          </span>
        )}
      </span>
      <span className="mt-1.5 flex items-start gap-1">
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13.5px] font-semibold">{item.title}</span>
          <span className="block truncate text-[11px] text-muted-foreground">{item.meta}</span>
        </span>
        {!item.videoId && <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
      </span>
    </>
  )

  if (item.videoId) {
    return (
      <button type="button" onClick={() => onPlay(item)} className="block w-full text-left">
        {art}
      </button>
    )
  }
  return (
    <Link href={item.href} className="block w-full">
      {art}
    </Link>
  )
}
