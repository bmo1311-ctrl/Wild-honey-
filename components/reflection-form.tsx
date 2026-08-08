'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { saveReflection } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { Milestone } from '@/lib/types'
import { cn } from '@/lib/utils'

const MILESTONES: { value: Milestone; label: string }[] = [
  { value: '30_day', label: '30 days' },
  { value: '60_day', label: '60 days' },
  { value: '90_day', label: '90 days' },
  { value: 'custom', label: 'just because' },
]

const QUESTIONS = [
  { key: 'qChanged', label: "what has changed?" },
  { key: 'qProud', label: 'what are you proud of?' },
  { key: 'qDifferent', label: 'what feels different?' },
  { key: 'qBecoming', label: 'the woman I am becoming is…' },
] as const

export function ReflectionForm() {
  const [open, setOpen] = useState(false)
  const [milestone, setMilestone] = useState<Milestone>('30_day')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [pending, startTransition] = useTransition()

  function handleSubmit() {
    startTransition(async () => {
      const res = await saveReflection({ milestone, ...answers })
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success('Reflection saved.')
      setAnswers({})
      setOpen(false)
    })
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl border border-dashed border-border bg-card p-5 text-center text-sm font-medium text-muted-foreground"
      >
        + write a reflection
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-card p-5 ring-1 ring-border">
      <p className="font-serif text-lg font-semibold">a moment to reflect</p>
      <div className="flex flex-wrap gap-1.5">
        {MILESTONES.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => setMilestone(m.value)}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-border transition-colors',
              milestone === m.value ? 'bg-foreground text-background ring-foreground' : 'bg-transparent text-muted-foreground',
            )}
          >
            {m.label}
          </button>
        ))}
      </div>
      {QUESTIONS.map((q) => (
        <div key={q.key} className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">{q.label}</label>
          <Textarea
            value={answers[q.key] ?? ''}
            onChange={(e) => setAnswers((prev) => ({ ...prev, [q.key]: e.target.value }))}
            rows={2}
          />
        </div>
      ))}
      <div className="flex gap-2">
        <Button onClick={handleSubmit} disabled={pending} className="h-11 flex-1">
          {pending ? 'saving…' : 'save reflection'}
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)} className="h-11">
          cancel
        </Button>
      </div>
    </div>
  )
}
