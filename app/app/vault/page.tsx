import { WatchBrowser } from '@/components/watch-browser'
import { getResources } from '@/lib/data'
import { FeatureOff } from '@/components/feature-off'
import { FEATURES } from '@/lib/features'

/** Teaching videos only. Food lives in Nutrition, training lives in Fitness. */
export default async function WatchPage() {
  if (!FEATURES.vault) return <FeatureOff />
  const resources = await getResources()

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-serif text-[29px] font-semibold leading-[1.1]">Watch</h1>
        <p className="mt-1 text-sm text-muted-foreground">teaching videos on identity, mindset and faith.</p>
      </div>
      <WatchBrowser resources={resources} />
    </div>
  )
}
