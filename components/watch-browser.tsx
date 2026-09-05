'use client'

import { useMemo, useState } from 'react'
import { Play } from 'lucide-react'
import { VaultPlayer } from '@/components/vault-player'
import { youTubeId, youTubeThumb } from '@/lib/youtube'
import type { Resource } from '@/lib/types'
import { cn } from '@/lib/utils'

const TABS = ['For you', 'All', 'Body', 'Identity', 'Mindset', 'Faith'] as const

/** Teaching videos only. Nothing to read, one tap to watch. */
export function WatchBrowser({ resources, preferredPillars = [] }: { resources: Resource[]; preferredPillars?: string[] }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>(preferredPillars.length ? 'For you' : 'All')
  // the pillars behind the goals she chose come first; everything else follows
  const rank = (p: string | null) => {
    const i = p ? preferredPillars.indexOf(p) : -1
    return i === -1 ? 99 : i
  }
  const [playing, setPlaying] = useState<{ id: string; title: string; description: string } | null>(null)

  const videos = useMemo(
    () =>
      resources
        .map((r) => ({ ...r, videoId: youTubeId(r.url) }))
        .filter((r) => r.videoId)
        .filter((r) => tab === 'All' || tab === 'For you' || r.pillar === tab)
        .sort((a, b) => (tab === 'For you' ? rank(a.pillar) - rank(b.pillar) : 0)),
    [resources, tab, preferredPillars],
  )

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: resources.filter((r) => youTubeId(r.url)).length }
    c['For you'] = c.All
    for (const t of TABS.slice(1)) c[t] = resources.filter((r) => r.pillar === t && youTubeId(r.url)).length
    return c
  }, [resources])

  return (
    <div className="flex flex-col gap-4">
      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              'shrink-0 rounded-full px-3.5 py-2 text-sm font-medium transition-colors',
              tab === t ? 'bg-mindset-pillar text-white' : 'bg-muted text-muted-foreground',
            )}
          >
            {t}
            <span className="ml-1.5 opacity-70">{counts[t] ?? 0}</span>
          </button>
        ))}
      </div>

      {videos.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-[15px] text-muted-foreground">
          Nothing here yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {videos.map((v) => (
            <li key={v.id}>
              <button
                type="button"
                onClick={() => setPlaying({ id: v.videoId!, title: v.title, description: v.description ?? '' })}
                className="w-full text-left"
              >
                <span className="relative block aspect-video w-full overflow-hidden rounded-2xl bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={v.image_url ?? youTubeThumb(v.videoId!)} alt="" className="h-full w-full object-cover" loading="lazy" />
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-black/55 text-white">
                      <Play className="ml-1 h-6 w-6 fill-current" />
                    </span>
                  </span>
                </span>
                <span className="mt-2 flex items-center gap-2">
                  {v.pillar && (
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: `var(--pillar-${v.pillar.toLowerCase()})` }}
                      aria-hidden="true"
                    />
                  )}
                  <span className="text-[16px] font-semibold leading-snug text-pretty">{v.title}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {playing && (
        <VaultPlayer videoId={playing.id} title={playing.title} description={playing.description} onClose={() => setPlaying(null)} />
      )}
    </div>
  )
}
