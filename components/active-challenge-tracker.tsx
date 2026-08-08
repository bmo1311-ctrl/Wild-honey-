'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Check, X } from 'lucide-react'
import { checkInChallenge, leaveChallenge } from '@/app/actions'
import type { Challenge } from '@/lib/types'
import { cn } from '@/lib/utils'

export function ActiveChallengeTracker({ challenge, compact = false }: { challenge: Challenge; compact?: boolean }) {
  const [daysCompleted, setDaysCompleted] = useState(challenge.days_completed ?? 0)
  const [pending, startTransition] = useTransition()

  const finished = daysCompleted >= challenge.length_days

  function handleCheckIn() {
    setDaysCompleted((d) => d + 1)
    startTransition(async () => {
      const res = await checkInChallenge(challenge.id)
      if (res?.error) {
        setDaysCompleted((d) => Math.max(0, d - 1))
        toast.error(res.error)
      }
    })
  }

  function handleLeave() {
    startTransition(async () => {
      const res = await leaveChallenge(challenge.id)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success('Left the challenge.')
    })
  }

  return (
    <div className={cn('flex flex-col gap-3 rounded-2xl bg-foreground p-5 text-background', compact && 'gap-2 p-4')}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-background/60">
            {finished ? 'complete!' : `day ${Math.min(daysCompleted + 1, challenge.length_days)} of ${challenge.length_days}`}
          </p>
          <h3 className="font-serif text-lg font-semibold">{challenge.title}</h3>
        </div>
        {!compact && (
          <button type="button" onClick={handleLeave} className="text-background/60">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="flex gap-1">
        {Array.from({ length: challenge.length_days }, (_, i) => i + 1).map((n) => (
          <span key={n} className={cn('h-2 flex-1 rounded-full', n <= daysCompleted ? 'bg-honey' : 'bg-background/20')} />
        ))}
      </div>
      <button
        type="button"
        onClick={handleCheckIn}
        disabled={pending || finished}
        className="flex h-10 items-center justify-center gap-1.5 rounded-full bg-honey text-sm font-medium text-honey-foreground disabled:opacity-60"
      >
        <Check className="h-3.5 w-3.5" />
        {finished ? "you're done!" : "mark today's day complete"}
      </button>
    </div>
  )
}
