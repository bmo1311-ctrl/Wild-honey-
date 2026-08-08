'use client'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Check, X } from 'lucide-react'
import { completeProtocolDay, endProtocol } from '@/app/actions'
import type { Protocol } from '@/lib/protocols'
import type { ProtocolDayCompletion, ProtocolEnrollment } from '@/lib/types'
import { cn } from '@/lib/utils'

export function ProtocolTracker({
  enrollment,
  protocol,
  completions,
}: {
  enrollment: ProtocolEnrollment
  protocol: Protocol
  completions: ProtocolDayCompletion[]
}) {
  const [localCompletions, setLocalCompletions] = useState(completions)
  const [pending, startTransition] = useTransition()

  const doneDays = new Set(localCompletions.map((c) => c.day_number))
  const currentDay = protocol.days.find((d) => !doneDays.has(d.day)) ?? protocol.days[protocol.days.length - 1]
  const finished = doneDays.size >= protocol.lengthDays

  function handleToggleDay(dayNumber: number) {
    const wasDone = doneDays.has(dayNumber)
    setLocalCompletions((prev) =>
      wasDone
        ? prev.filter((c) => c.day_number !== dayNumber)
        : [...prev, { id: 'temp', enrollment_id: enrollment.id, user_id: '', day_number: dayNumber, completed_at: new Date().toISOString() }],
    )
    startTransition(async () => {
      const res = await completeProtocolDay(enrollment.id, dayNumber)
      if (res?.error) {
        toast.error(res.error)
        setLocalCompletions(completions)
      }
    })
  }

  function handleEnd() {
    startTransition(async () => {
      const res = await endProtocol(enrollment.id)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success('Protocol ended.')
    })
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-foreground p-5 text-background">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-background/60">
            {finished ? 'complete!' : `day ${currentDay.day} of ${protocol.lengthDays}`}
          </p>
          <h3 className="font-serif text-xl font-semibold">{protocol.title}</h3>
        </div>
        <button type="button" onClick={handleEnd} className="text-background/60">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {protocol.days.map((d) => {
          const done = doneDays.has(d.day)
          return (
            <button
              key={d.day}
              type="button"
              onClick={() => handleToggleDay(d.day)}
              disabled={pending}
              className={cn(
                'flex items-start gap-3 rounded-xl p-3 text-left transition-colors',
                done ? 'bg-background/15' : 'bg-background/5 hover:bg-background/10',
              )}
            >
              <span
                className={cn(
                  'hex-clip mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center text-xs font-semibold',
                  done ? 'bg-honey text-honey-foreground' : 'bg-background/20 text-background/70',
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : d.day}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  day {d.day} · {d.title}
                </p>
                <ul className="mt-1 flex flex-col gap-0.5">
                  {d.actions.map((a, i) => (
                    <li key={i} className="text-xs text-background/70">
                      · {a}
                    </li>
                  ))}
                </ul>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
