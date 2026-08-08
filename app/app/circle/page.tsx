import { CircleCard } from '@/components/circle-card'
import { HoneycombMark } from '@/components/logo'
import { getCircleFeed, getSessionProfile } from '@/lib/data'

export default async function CirclePage() {
  const [feed, profile] = await Promise.all([getCircleFeed(), getSessionProfile()])
  const canPin = profile?.membership_tier === 'founder' || Boolean(profile?.is_admin)

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-serif text-3xl font-semibold">The Circle</h1>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">
          Entries other women chose to share. Give honey. Offer warmth.
        </p>
      </div>

      {feed.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <HoneycombMark className="h-12 w-12" />
          <p className="font-serif text-lg font-semibold">The circle is quiet</p>
          <p className="max-w-xs text-sm text-muted-foreground text-pretty">
            No one has shared yet today. Be the first to open the door by sharing an entry from Today.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {feed.map((entry) => (
            <CircleCard key={entry.id} entry={entry} canPin={canPin} />
          ))}
        </div>
      )}
    </div>
  )
}
