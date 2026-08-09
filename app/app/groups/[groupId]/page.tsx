import { notFound } from 'next/navigation'
import { GroupHeader } from '@/components/group-header'
import { GroupPostComposer } from '@/components/group-post-composer'
import { GroupPostCard } from '@/components/group-post-card'
import { getGroupById, getGroupMembers, getGroupPosts, getSessionProfile } from '@/lib/data'

export default async function GroupDetailPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params
  const [group, members, profile] = await Promise.all([getGroupById(groupId), getGroupMembers(groupId), getSessionProfile()])

  if (!group) notFound()

  const isMember = members.some((m) => m.user_id === profile?.id)
  if (!isMember) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <p className="font-serif text-lg font-semibold">this group is private</p>
        <p className="max-w-xs text-sm text-muted-foreground text-pretty">ask the group owner for the invite code to join.</p>
      </div>
    )
  }

  const posts = await getGroupPosts(groupId)

  return (
    <div className="flex flex-col gap-6">
      <GroupHeader group={group} members={members} />
      <GroupPostComposer groupId={groupId} />
      {posts.length === 0 ? (
        <p className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground ring-1 ring-border">nothing posted yet — be the first to say hello.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {posts.map((p) => (
            <GroupPostCard key={p.id} post={p} />
          ))}
        </div>
      )}
    </div>
  )
}
