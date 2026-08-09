'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { Users } from 'lucide-react'
import { adminCreateGroupForRetreat } from '@/app/actions'

export function CreateRetreatGroupButton({ retreatId, hasGroup }: { retreatId: string; hasGroup: boolean }) {
  const [pending, startTransition] = useTransition()

  if (hasGroup) {
    return <span className="flex items-center gap-1.5 text-xs font-medium text-honey"><Users className="h-3.5 w-3.5" /> attendee group active</span>
  }

  function handleClick() {
    startTransition(async () => {
      const res = await adminCreateGroupForRetreat(retreatId)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success(`Group created with ${res.memberCount} member${res.memberCount === 1 ? '' : 's'}.`)
    })
  }

  return (
    <button type="button" onClick={handleClick} disabled={pending} className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground">
      <Users className="h-3.5 w-3.5" />
      {pending ? 'creating…' : 'create attendee group'}
    </button>
  )
}
