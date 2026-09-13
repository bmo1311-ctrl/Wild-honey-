import { Compass } from 'lucide-react'
import { SEASON_META } from '@/lib/honey-profile'
import type { Season } from '@/lib/types'

/**
 * The seasons she is in. Plural, deliberately.
 *
 * This card used to show one, because the column held one. A woman building
 * a business while rebuilding, in motherhood, deepening her faith is in four
 * at once, and being asked to pick the truest one is a question with no
 * honest answer — the others do not stop being true because a form only had
 * room for one.
 *
 * They are shown as a set with no ranking. Nothing here decides which is
 * most important, because that changes by the week and she is the only one
 * who knows.
 */
export function MySeasonCard({ seasons }: { seasons: Season[] }) {
  const live = seasons.filter((s) => SEASON_META[s])

  if (live.length === 0) {
    return (
      <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
        <p className="flex items-center gap-1.5 font-serif text-lg font-semibold">
          <Compass className="h-4 w-4 text-honey" />
          my seasons
        </p>
        <p className="mt-1 text-sm text-pretty text-muted-foreground">
          not set yet — you can choose as many as are true from your Honey Profile.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
      <p className="flex items-center gap-1.5 font-serif text-lg font-semibold">
        <Compass className="h-4 w-4 text-honey" />
        {live.length === 1 ? 'my season' : 'my seasons'}
      </p>
      <div className="mt-2 flex flex-col gap-2.5">
        {live.map((s) => (
          <div key={s}>
            <p className="font-serif text-[19px] font-semibold leading-tight text-honey">
              {SEASON_META[s].label}
            </p>
            <p className="mt-0.5 text-[13px] leading-[1.45] text-pretty text-muted-foreground">
              {SEASON_META[s].description}
            </p>
          </div>
        ))}
      </div>
      {live.length > 1 && (
        <p className="mt-3 text-[12px] leading-[1.45] text-pretty text-muted-foreground">
          Carrying {live.length} at once is worth knowing about yourself. It is usually the
          honest answer, and it explains a great deal about where your capacity goes.
        </p>
      )}
    </div>
  )
}
