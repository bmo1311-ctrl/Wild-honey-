import { CircleCard } from '@/components/circle-card'
import { CommunityPostCard } from '@/components/community-post-card'
import { CommunityComposer } from '@/components/community-composer'
import { PraiseReportCard } from '@/components/praise-report-card'
import { HoneycombMark } from '@/components/logo'
import { getUnifiedCircleFeed, getSessionProfile } from '@/lib/data'

export default async function CirclePage() {
  const [feed, profile] = await Promise.all([getUnifiedCircleFeed(), getSessionProfile()])
  const canPin = profile?.membership_tier === 'founder' || Boolean(profile?.is_admin)

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-serif text-3xl font-semibold">The Circle</h1>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">
          share a photo, a win, a reflection — this is the one open room.
        </p>
      </div>

      <PraiseReportCard />
      <CommunityComposer />

      {feed.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <HoneycombMark className="h-12 w-12" />
          <p className="font-serif text-lg font-semibold">The circle is quiet</p>
          <p className="max-w-xs text-sm text-muted-foreground text-pretty">
            be the first to share something — a post above, or an entry from Today.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {feed.map((item) =>
            item.kind === 'journal' ? (
              <CircleCard key={`j-${item.id}`} entry={item.entry} canPin={canPin} />
            ) : (
              <CommunityPostCard key={`c-${item.id}`} post={item.post} canPin={canPin} />
            ),
          )}
        </div>
      )}
    </div>
  )
}
