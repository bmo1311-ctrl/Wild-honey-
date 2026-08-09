'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Crown, Tent } from 'lucide-react'
import { adminToggleAdminStatus, adminUpdateMemberTier } from '@/app/actions'
import { relativeTime } from '@/lib/pillars'
import { cn } from '@/lib/utils'

const TIERS = ['free', 'circle', 'inner-circle', 'founder']

export function MemberRow({ member }: { member: any }) {
  const [tier, setTier] = useState(member.membership_tier)
  const [isAdmin, setIsAdmin] = useState(member.is_admin)
  const [pending, startTransition] = useTransition()

  function handleTierChange(next: string) {
    setTier(next)
    startTransition(async () => {
      const res = await adminUpdateMemberTier(member.id, next)
      if (res?.error) {
        toast.error(res.error)
        setTier(member.membership_tier)
      }
    })
  }

  function handleToggleAdmin() {
    const next = !isAdmin
    setIsAdmin(next)
    startTransition(async () => {
      const res = await adminToggleAdminStatus(member.id, next)
      if (res?.error) {
        toast.error(res.error)
        setIsAdmin(!next)
      }
    })
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-card p-3 ring-1 ring-border sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-medium">{member.name}</p>
          {isAdmin && <Crown className="h-3 w-3 text-honey" />}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {member.email ?? 'no email on file'} · joined {relativeTime(member.created_at)}
          {member.confirmed_retreats > 0 && (
            <span className="ml-1.5 inline-flex items-center gap-0.5">
              <Tent className="h-3 w-3" /> {member.confirmed_retreats}
            </span>
          )}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <select
          value={tier}
          onChange={(e) => handleTierChange(e.target.value)}
          disabled={pending}
          className="h-9 rounded-md border border-input bg-background px-2 text-xs"
        >
          {TIERS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleToggleAdmin}
          disabled={pending}
          className={cn(
            'rounded-full px-2.5 py-1.5 text-xs font-medium ring-1 ring-border',
            isAdmin ? 'bg-honey/15 text-honey' : 'text-muted-foreground',
          )}
        >
          {isAdmin ? 'admin' : 'make admin'}
        </button>
      </div>
    </div>
  )
}
