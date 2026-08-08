import { MemberRow } from '@/components/admin/member-row'
import { adminGetMembers } from '@/app/actions'

export default async function AdminMembersPage() {
  const members = await adminGetMembers()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Members</h1>
        <p className="mt-1 text-sm text-muted-foreground">{members.length} total — manage tiers and admin access here.</p>
      </div>
      <div className="flex flex-col gap-2">
        {members.map((m: any) => (
          <MemberRow key={m.id} member={m} />
        ))}
      </div>
    </div>
  )
}
