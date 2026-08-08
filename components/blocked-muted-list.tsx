'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { unblockUser, unmuteUser } from '@/app/actions'
import { BloomAvatar } from '@/components/bloom-avatar'

export function BlockedMutedList({ blocked, muted }: { blocked: any[]; muted: any[] }) {
  const [pending, startTransition] = useTransition()

  function handleUnblock(id: string) {
    startTransition(async () => {
      const res = await unblockUser(id)
      if (res?.error) toast.error(res.error)
      else toast.success('Unblocked.')
    })
  }

  function handleUnmute(id: string) {
    startTransition(async () => {
      const res = await unmuteUser(id)
      if (res?.error) toast.error(res.error)
      else toast.success('Unmuted.')
    })
  }

  if (blocked.length === 0 && muted.length === 0) return null

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-card p-5 ring-1 ring-border">
      <p className="font-serif text-lg font-semibold">blocked &amp; muted</p>
      {blocked.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium text-muted-foreground">blocked</p>
          {blocked.map((b) => (
            <div key={b.id} className="flex items-center gap-2.5 rounded-lg bg-secondary/40 px-3 py-2">
              <BloomAvatar name={b.profile?.name ?? 'H'} color={b.profile?.avatar_color ?? 'honey'} className="h-7 w-7 text-xs" />
              <span className="flex-1 text-sm">{b.profile?.name ?? 'a member'}</span>
              <button type="button" onClick={() => handleUnblock(b.id)} disabled={pending} className="text-xs font-medium text-honey">
                unblock
              </button>
            </div>
          ))}
        </div>
      )}
      {muted.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium text-muted-foreground">muted</p>
          {muted.map((m) => (
            <div key={m.id} className="flex items-center gap-2.5 rounded-lg bg-secondary/40 px-3 py-2">
              <BloomAvatar name={m.profile?.name ?? 'H'} color={m.profile?.avatar_color ?? 'honey'} className="h-7 w-7 text-xs" />
              <span className="flex-1 text-sm">{m.profile?.name ?? 'a member'}</span>
              <button type="button" onClick={() => handleUnmute(m.id)} disabled={pending} className="text-xs font-medium text-honey">
                unmute
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
