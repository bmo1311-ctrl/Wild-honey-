'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Beaker, Check, Plus, X } from 'lucide-react'
import { abandonExperiment, checkInExperimentDay, deleteExperiment, reflectOnExperiment, startExperiment } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { PersonalExperiment } from '@/lib/types'
import { cn } from '@/lib/utils'

const LENGTH_PRESETS = [7, 10, 14, 21]

function daysSinceStart(startDate: string): number {
  const start = new Date(startDate + 'T00:00:00')
  return Math.floor((Date.now() - start.getTime()) / 86400000) + 1
}

const HELPED_LABEL: Record<string, string> = {
  yes: 'yes, it helped',
  somewhat: 'somewhat',
  no: 'not really',
}

function ExperimentCard({ experiment }: { experiment: PersonalExperiment }) {
  const [reflecting, setReflecting] = useState(false)
  const [helped, setHelped] = useState<'yes' | 'somewhat' | 'no' | null>(null)
  const [reflectionText, setReflectionText] = useState('')
  const [checkedToday, setCheckedToday] = useState(false)
  const [pending, startTransition] = useTransition()

  const daysCompleted = experiment.days_completed ?? 0
  const dayNumber = Math.min(daysSinceStart(experiment.start_date), experiment.length_days)
  const isDue = daysSinceStart(experiment.start_date) > experiment.length_days
  const isComplete = experiment.status === 'completed'

  function handleCheckIn() {
    startTransition(async () => {
      const res = await checkInExperimentDay(experiment.id)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      setCheckedToday(true)
      toast.success('Logged for today.')
    })
  }

  function handleReflect() {
    if (!helped) {
      toast.error('Pick an answer first.')
      return
    }
    startTransition(async () => {
      const res = await reflectOnExperiment(experiment.id, helped, reflectionText)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success('Recorded — that\u2019s real self-knowledge.')
      setReflecting(false)
    })
  }

  function handleAbandon() {
    startTransition(async () => {
      const res = await abandonExperiment(experiment.id)
      if (res?.error) toast.error(res.error)
    })
  }

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteExperiment(experiment.id)
      if (res?.error) toast.error(res.error)
    })
  }

  if (isComplete) {
    return (
      <div className="flex flex-col gap-1.5 rounded-xl bg-secondary/40 p-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{experiment.title}</p>
          <span className="rounded-full bg-honey/15 px-2 py-0.5 text-[0.65rem] font-medium text-honey">{HELPED_LABEL[experiment.helped ?? '']}</span>
        </div>
        {experiment.reflection_text && <p className="text-xs text-muted-foreground text-pretty">{experiment.reflection_text}</p>}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-secondary/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{experiment.title}</p>
        <button type="button" onClick={handleDelete} className="shrink-0 text-muted-foreground/60">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      {experiment.description && <p className="text-xs text-muted-foreground text-pretty">{experiment.description}</p>}

      <div className="flex gap-1">
        {Array.from({ length: experiment.length_days }, (_, i) => i + 1).map((n) => (
          <span key={n} className={cn('h-1.5 flex-1 rounded-full', n <= daysCompleted ? 'bg-honey' : 'bg-border')} />
        ))}
      </div>
      <p className="text-[0.65rem] text-muted-foreground">
        day {dayNumber} of {experiment.length_days}
      </p>

      {!isDue ? (
        <Button onClick={handleCheckIn} disabled={pending || checkedToday} className="h-9 text-xs">
          <Check className="h-3.5 w-3.5" />
          {checkedToday ? 'logged for today' : 'log today'}
        </Button>
      ) : !reflecting ? (
        <div className="flex flex-col gap-2 rounded-lg bg-card p-3 ring-1 ring-border">
          <p className="text-xs font-medium">the {experiment.length_days} days are up — did this actually help you?</p>
          <div className="flex gap-1.5">
            {(['yes', 'somewhat', 'no'] as const).map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => {
                  setHelped(h)
                  setReflecting(true)
                }}
                className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground"
              >
                {HELPED_LABEL[h]}
              </button>
            ))}
          </div>
          <button type="button" onClick={handleAbandon} className="self-start text-[0.65rem] text-muted-foreground">
            let this one go without reflecting
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <Textarea value={reflectionText} onChange={(e) => setReflectionText(e.target.value)} rows={2} placeholder="anything you noticed? (optional)" />
          <div className="flex gap-2">
            <Button onClick={handleReflect} disabled={pending} size="sm" className="h-9">
              save reflection
            </Button>
            <button type="button" onClick={() => setReflecting(false)} className="text-xs text-muted-foreground">
              back
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function ExperimentsPanel({ experiments }: { experiments: PersonalExperiment[] }) {
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [lengthDays, setLengthDays] = useState(7)
  const [pending, startTransition] = useTransition()

  const active = experiments.filter((e) => e.status === 'active')
  const completed = experiments.filter((e) => e.status === 'completed')

  function handleStart() {
    if (!title.trim()) {
      toast.error('Name your experiment first.')
      return
    }
    startTransition(async () => {
      const res = await startExperiment({ title, description, lengthDays })
      if (res?.error) {
        toast.error(res.error)
        return
      }
      setTitle('')
      setDescription('')
      setAdding(false)
      toast.success('Experiment started.')
    })
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-card p-5 ring-1 ring-border">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 font-serif text-lg font-semibold">
          <Beaker className="h-4 w-4 text-honey" />
          my experiments
        </p>
        <button type="button" onClick={() => setAdding((a) => !a)} className="flex items-center gap-1 text-xs font-medium text-honey">
          <Plus className="h-3.5 w-3.5" />
          start one
        </button>
      </div>

      {adding && (
        <div className="flex flex-col gap-2 rounded-xl bg-secondary/50 p-3">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Morning Light Experiment" className="h-10" />
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="what are you testing? (optional)" />
          <div className="flex flex-wrap gap-1.5">
            {LENGTH_PRESETS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setLengthDays(n)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-border',
                  lengthDays === n ? 'bg-foreground text-background ring-foreground' : 'text-muted-foreground',
                )}
              >
                {n} days
              </button>
            ))}
          </div>
          <Button onClick={handleStart} disabled={pending} className="h-9 self-start text-xs">
            start experiment
          </Button>
        </div>
      )}

      {active.length === 0 && completed.length === 0 ? (
        <p className="text-sm text-muted-foreground">try something for a set number of days, then find out honestly whether it actually helped — not just whether you finished.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {active.map((e) => (
            <ExperimentCard key={e.id} experiment={e} />
          ))}
          {completed.slice(0, 3).map((e) => (
            <ExperimentCard key={e.id} experiment={e} />
          ))}
        </div>
      )}
    </div>
  )
}
