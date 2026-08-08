'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Copy, LogOut, Users } from 'lucide-react'
import { leaveGroup } from '@/app/actions'
import type { Group, GroupMember } from '@/lib/types'
import { PILLAR_META } from '@/lib/pillars'

export function GroupHeader({ group, members }: { group: Group; members: GroupMember[] }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleCopyCode() {
    navigator.clipboard?.writeText(group.invite_code)
    toast.success('Invite code copied.')
  }

  function handleLeave() {
    startTransition(async () => {
      const res = await leaveGroup(group.id)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success('Left the group.')
      router.push('/app/groups')
    })
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-card p-5 ring-1 ring-border">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-pretty">{group.name}</h1>
          {group.description && <p className="mt-1 text-sm text-muted-foreground text-pretty">{group.description}</p>}
        </div>
        {group.pillar && <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${PILLAR_META[group.pillar].chip}`}>{group.pillar}</span>}
      </div>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          {members.length} member{members.length === 1 ? '' : 's'}
        </span>
        <div className="flex items-center gap-3">
          <button type="button" onClick={handleCopyCode} className="flex items-center gap-1 text-xs font-medium text-honey">
            <Copy className="h-3 w-3" />
            {group.invite_code}
          </button>
          <button type="button" onClick={handleLeave} disabled={pending} className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <LogOut className="h-3 w-3" />
            leave
          </button>
        </div>
      </div>
    </div>
  )
}
