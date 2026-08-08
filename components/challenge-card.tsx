'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { Users, Calendar } from 'lucide-react'
import { joinChallenge } from '@/app/actions'
import { Button } from '@/components/ui/button'
import type { Challenge } from '@/lib/types'
import { PILLAR_META } from '@/lib/pillars'

export function ChallengeCard({ challenge }: { challenge: Challenge }) {
  const [pending, startTransition] = useTransition()

  function handleJoin() {
    startTransition(async () => {
      const res = await joinChallenge(challenge.id)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success(`Joined ${challenge.title}.`)
    })
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-card p-5 ring-1 ring-border">
      <div>
        {challenge.pillar && <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${PILLAR_META[challenge.pillar].chip}`}>{challenge.pillar}</span>}
        <h3 className="mt-2 font-serif text-lg font-semibold">{challenge.title}</h3>
        {challenge.description && <p className="mt-1 text-sm text-muted-foreground text-pretty">{challenge.description}</p>}
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{challenge.length_days} days</span>
        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{challenge.participant_count ?? 0} joined</span>
      </div>
      <Button onClick={handleJoin} disabled={pending} className="h-10">
        {pending ? 'joining…' : 'join challenge'}
      </Button>
    </div>
  )
}
