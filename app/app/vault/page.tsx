import { VaultBrowser } from '@/components/vault-browser'
import { buildVaultIndex } from '@/lib/vault'
import { buildEngineShelves } from '@/lib/engine'
import { getAccess, GOAL_PILLAR, getContentEvents, getMyGoals, getResources } from '@/lib/data'
import { FeatureOff } from '@/components/feature-off'
import { LockedArea } from '@/components/locked'
import { FEATURES } from '@/lib/features'

/** Teaching videos only. Food lives in Nutrition, training lives in Fitness. */
export default async function WatchPage() {
  if (!FEATURES.vault) return <FeatureOff />
  const access = await getAccess()
  if (!access.paid) return <LockedArea title="Watch" subtitle="teaching videos on identity, mindset and faith." blurb="The whole library, on shelves that learn what you watch. Part of The Circle." from="watch" />
  const [resources, goals, events] = await Promise.all([getResources(), getMyGoals(), getContentEvents()])
  const goalPillars = [...new Set(goals.map((g) => GOAL_PILLAR[g.goal]).filter(Boolean))]
  const videos = buildVaultIndex({ resources, recipes: [], workouts: [] }).filter((i) => i.videoId)
  const shelves = buildEngineShelves(videos, { goalPillars, events })

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-serif text-[29px] font-semibold leading-[1.1]">Watch</h1>
        <p className="mt-1 text-sm text-muted-foreground">teaching videos on identity, mindset and faith.</p>
      </div>
      <VaultBrowser shelves={shelves} all={videos} />
    </div>
  )
}
