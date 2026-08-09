'use client'

import { useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { RefreshCw, Sparkles } from 'lucide-react'
import { getCheckinGap, saveResetReflection } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

const QUESTIONS = [
  { key: 'whatHappened', label: 'what happened?' },
  { key: 'needToday', label: 'what do you need today?' },
  { key: 'nextStep', label: "what's one thing you can do?" },
  { key: 'carryingForward', label: 'what do you want to carry forward?' },
] as const

export function ResetPanel() {
  const [gap, setGap] = useState<number | null | undefined>(undefined)
  const [open, setOpen] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [pending, startTransition] = useTransition()
  const [done, setDone] = useState(false)

  useEffect(() => {
    getCheckinGap().then((res) => setGap(res.daysSinceLastCheckin))
  }, [])

  function handleSave() {
    startTransition(async () => {
      const res = await saveResetReflection(answers)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      setDone(true)
      toast.success('You\u2019re back. That\u2019s all it takes.')
    })
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl bg-honey/10 p-6 text-center ring-1 ring-honey/30">
        <Sparkles className="h-6 w-6 text-honey" />
        <p className="font-serif text-lg font-semibold text-honey">welcome back</p>
        <p className="text-sm text-muted-foreground">you don't have to start over — you just had to return, and you did.</p>
      </div>
    )
  }

  const showBanner = gap !== undefined && gap !== null && gap >= 2 && !dismissed && !open

  if (showBanner) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-secondary/50 p-4">
        <p className="text-sm text-pretty">
          it's been a few days — no need to explain. <button type="button" onClick={() => setOpen(true)} className="font-medium text-honey underline underline-offset-2">start here</button>
        </p>
        <button type="button" onClick={() => setDismissed(true)} className="shrink-0 text-xs text-muted-foreground">
          not now
        </button>
      </div>
    )
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-border bg-card p-3 text-xs font-medium text-muted-foreground"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        I'm resetting
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-card p-5 ring-1 ring-border">
      <div>
        <p className="font-serif text-lg font-semibold">I'm resetting</p>
        <p className="text-xs text-muted-foreground">you don't have to start over. you just have to return.</p>
      </div>
      {QUESTIONS.map((q) => (
        <div key={q.key} className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">{q.label}</label>
          <Textarea value={answers[q.key] ?? ''} onChange={(e) => setAnswers((prev) => ({ ...prev, [q.key]: e.target.value }))} rows={2} />
        </div>
      ))}
      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={pending} className="h-10 flex-1">
          {pending ? 'saving…' : 'return'}
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)} className="h-10">
          cancel
        </Button>
      </div>
    </div>
  )
}
