'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { adminToggleChallengeActive } from '@/app/actions'
import { AddChallengeForm } from '@/components/admin/challenge-form'
import type { Challenge } from '@/lib/types'
import { cn } from '@/lib/utils'

function ChallengeRow({ challenge }: { challenge: Challenge }) {
  const [active, setActive] = useState(challenge.is_active)
  const [pending, startTransition] = useTransition()

  function handleToggle() {
    const next = !active
    setActive(next)
    startTransition(async () => {
      const res = await adminToggleChallengeActive(challenge.id, next)
      if (res?.error) {
        setActive(!next)
        toast.error(res.error)
      }
    })
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-card p-3 ring-1 ring-border">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{challenge.title}</p>
        <p className="text-xs text-muted-foreground">
          {challenge.length_days} days · {challenge.participant_count ?? 0} joined
        </p>
      </div>
      <button
        type="button"
        onClick={handleToggle}
        disabled={pending}
        className={cn('shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-border', active ? 'bg-honey/15 text-honey' : 'text-muted-foreground')}
      >
        {active ? 'active' : 'inactive'}
      </button>
    </div>
  )
}

export function ChallengesAdminList({ challenges }: { challenges: Challenge[] }) {
  return (
    <div className="flex flex-col gap-6">
      <AddChallengeForm />
      <div className="flex flex-col gap-2">
        {challenges.map((c) => (
          <ChallengeRow key={c.id} challenge={c} />
        ))}
      </div>
    </div>
  )
}
