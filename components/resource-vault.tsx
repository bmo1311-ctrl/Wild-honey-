'use client'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Bookmark, ExternalLink, FileText, Headphones, Link2, Video } from 'lucide-react'
import { toggleSavedResource } from '@/app/actions'
import type { Pillar, Resource } from '@/lib/types'
import { PILLAR_META, PILLARS } from '@/lib/pillars'
import { cn } from '@/lib/utils'

const TYPE_ICON = {
  article: FileText,
  video: Video,
  pdf: FileText,
  audio: Headphones,
  link: Link2,
} as const

function ResourceCard({ resource }: { resource: Resource }) {
  const [saved, setSaved] = useState(Boolean(resource.saved))
  const [pending, startTransition] = useTransition()
  const Icon = TYPE_ICON[resource.resource_type] ?? Link2

  function handleToggleSave() {
    const next = !saved
    setSaved(next)
    startTransition(async () => {
      const res = await toggleSavedResource(resource.id)
      if (res?.error) {
        setSaved(!next)
        toast.error(res.error)
      }
    })
  }

  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-card p-4 ring-1 ring-border">
      {resource.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={resource.image_url} alt="" className="-mx-4 -mt-4 mb-1 h-36 w-[calc(100%+2rem)] rounded-t-2xl object-cover" />
      )}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          {resource.pillar && (
            <span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-medium ${PILLAR_META[resource.pillar].chip}`}>{resource.pillar}</span>
          )}
        </div>
        <button type="button" onClick={handleToggleSave} disabled={pending} className={cn('shrink-0', saved ? 'text-honey' : 'text-muted-foreground/50')}>
          <Bookmark className={cn('h-4 w-4', saved && 'fill-current')} />
        </button>
      </div>
      <p className="font-serif text-base font-semibold text-pretty">{resource.title}</p>
      {resource.description && <p className="text-sm text-muted-foreground text-pretty">{resource.description}</p>}
      {resource.url && (
        <a href={resource.url} target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-1 text-xs font-medium text-honey">
          open resource
          <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  )
}

export function ResourceVault({ resources }: { resources: Resource[] }) {
  const [pillarFilter, setPillarFilter] = useState<Pillar | null>(null)
  const [savedOnly, setSavedOnly] = useState(false)

  const filtered = resources.filter((r) => (!pillarFilter || r.pillar === pillarFilter) && (!savedOnly || r.saved))

  return (
    <div className="flex flex-col gap-4">
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
        <button
          type="button"
          onClick={() => setSavedOnly((s) => !s)}
          className={cn(
            'flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-border transition-colors',
            savedOnly ? 'bg-honey text-honey-foreground ring-honey' : 'bg-transparent text-muted-foreground',
          )}
        >
          <Bookmark className="h-3 w-3" />
          saved
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground ring-1 ring-border">
          {savedOnly ? "you haven't saved anything yet." : 'nothing here yet — check back soon.'}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((r) => (
            <ResourceCard key={r.id} resource={r} />
          ))}
        </div>
      )}
    </div>
  )
}
