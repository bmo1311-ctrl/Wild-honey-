'use client'
import { useTransition } from 'react'
import { toast } from 'sonner'
import { Calendar } from 'lucide-react'
import { startProtocol } from '@/app/actions'
import { Button } from '@/components/ui/button'
import type { Protocol } from '@/lib/protocols'
import { PILLAR_META } from '@/lib/pillars'

export function ProtocolCard({ protocol, suggested }: { protocol: Protocol; suggested?: boolean }) {
  const [pending, startTransition] = useTransition()

  function handleStart() {
    startTransition(async () => {
      const res = await startProtocol(protocol.slug)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success(`Started ${protocol.title}.`)
    })
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-card p-5 ring-1 ring-border">
      {suggested && <span className="w-fit rounded-full bg-honey/20 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-honey">suggested for today</span>}
      <div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${PILLAR_META[protocol.pillar].chip}`}>{protocol.pillar}</span>
        <h3 className="mt-2 font-serif text-lg font-semibold">{protocol.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">{protocol.tagline}</p>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Calendar className="h-3 w-3" />
        {protocol.lengthDays} days · best for {protocol.bestFor}
      </div>
      <Button onClick={handleStart} disabled={pending} className="h-10">
        {pending ? 'starting…' : 'start protocol'}
      </Button>
    </div>
  )
}
