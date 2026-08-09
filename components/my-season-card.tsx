import { Compass } from 'lucide-react'
import { SEASON_META } from '@/lib/honey-profile'
import type { Season } from '@/lib/types'

export function MySeasonCard({ season }: { season: Season | null }) {
  if (!season) {
    return (
      <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
        <p className="flex items-center gap-1.5 font-serif text-lg font-semibold">
          <Compass className="h-4 w-4 text-honey" />
          my season
        </p>
        <p className="mt-1 text-sm text-muted-foreground">not set yet — you can choose one during your Honey Profile or on Year Day.</p>
      </div>
    )
  }

  const meta = SEASON_META[season]
  return (
    <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
      <p className="flex items-center gap-1.5 font-serif text-lg font-semibold">
        <Compass className="h-4 w-4 text-honey" />
        my season
      </p>
      <p className="mt-2 font-serif text-2xl font-semibold text-honey">{meta.label}</p>
      <p className="mt-1 text-sm text-muted-foreground text-pretty">{meta.description}</p>
    </div>
  )
}
