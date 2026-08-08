import { Sparkles } from 'lucide-react'
import { CommunityComposer } from '@/components/community-composer'
import { CommunityPostCard } from '@/components/community-post-card'
import { getCommunityFeed, getSessionProfile } from '@/lib/data'

export default async function CommunityPage() {
  const [feed, profile] = await Promise.all([getCommunityFeed(), getSessionProfile()])
  const canPin = profile?.membership_tier === 'founder' || Boolean(profile?.is_admin)

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Community</h1>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">
          share a photo, a win, a question — this is the open room, not the private journal.
        </p>
      </div>

      <CommunityComposer />

      {feed.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <Sparkles className="h-10 w-10 text-muted-foreground" />
          <p className="font-serif text-lg font-semibold">nothing here yet</p>
          <p className="max-w-xs text-sm text-muted-foreground text-pretty">be the first to share something with the community.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {feed.map((post) => (
            <CommunityPostCard key={post.id} post={post} canPin={canPin} />
          ))}
        </div>
      )}
    </div>
  )
}
