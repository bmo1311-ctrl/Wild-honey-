import { Users } from 'lucide-react'
import { CreateOrJoinGroup, GroupListCard } from '@/components/group-actions'
import { getMyGroups } from '@/lib/data'
import { FeatureOff } from '@/components/feature-off'
import { FEATURES } from '@/lib/features'

export default async function GroupsPage() {
  if (!FEATURES.groups) return <FeatureOff />

  const groups = await getMyGroups()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Groups</h1>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">small private spaces — accountability groups, retreat cohorts, or anything you want to build with a few others.</p>
      </div>

      <CreateOrJoinGroup />

      {groups.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <Users className="h-10 w-10 text-muted-foreground" />
          <p className="font-serif text-lg font-semibold">no groups yet</p>
          <p className="max-w-xs text-sm text-muted-foreground text-pretty">start one, or join with an invite code from a friend or a retreat.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {groups.map((g) => (
            <GroupListCard key={g.id} group={g} />
          ))}
        </div>
      )}
    </div>
  )
}
