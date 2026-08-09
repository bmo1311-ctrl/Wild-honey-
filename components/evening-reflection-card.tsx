'use client'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Moon, Check } from 'lucide-react'
import { saveEveningReflection } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { EveningReflection } from '@/lib/types'

const QUESTIONS = [
  "what's one moment today you'd want to remember?",
  'where did you feel most like yourself today?',
  'what does tomorrow-you need from tonight-you?',
]

export function EveningReflectionCard({ existing }: { existing: EveningReflection | null }) {
  const [q1, setQ1] = useState(existing?.q1 ?? '')
  const [q2, setQ2] = useState(existing?.q2 ?? '')
  const [q3, setQ3] = useState(existing?.q3 ?? '')
  const [done, setDone] = useState(Boolean(existing))
  const [expanded, setExpanded] = useState(!existing)
  const [pending, startTransition] = useTransition()

  function handleSave() {
    if (!q1.trim() && !q2.trim() && !q3.trim()) {
      toast.error('Answer at least one question.')
      return
    }
    startTransition(async () => {
      const res = await saveEveningReflection({ q1, q2, q3 })
      if (res?.error) {
        toast.error(res.error)
        return
      }
      setDone(true)
      setExpanded(false)
      toast.success('Evening reflection saved.')
    })
  }

  if (done && !expanded) {
    return (
      <button type="button" onClick={() => setExpanded(true)} className="flex w-full items-center gap-3 rounded-2xl bg-card p-4 text-left ring-1 ring-border">
        <span className="hex-clip flex h-9 w-9 shrink-0 items-center justify-center bg-honey text-honey-foreground">
          <Check className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">evening reflection complete</p>
          <p className="text-xs text-muted-foreground">tap to review or edit</p>
        </div>
      </button>
    )
  }

  return (
    <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
      <div className="flex items-center gap-2">
        <Moon className="h-4 w-4 text-honey" />
        <p className="text-sm font-semibold">evening reflection</p>
      </div>
      <div className="mt-4 flex flex-col gap-4">
        {[
          { q: QUESTIONS[0], val: q1, set: setQ1 },
          { q: QUESTIONS[1], val: q2, set: setQ2 },
          { q: QUESTIONS[2], val: q3, set: setQ3 },
        ].map((item, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">{item.q}</label>
            <Textarea value={item.val} onChange={(e) => item.set(e.target.value)} rows={2} className="resize-none" />
          </div>
        ))}
      </div>
      <Button onClick={handleSave} disabled={pending} className="mt-4 h-11 w-full">
        {pending ? 'saving…' : done ? 'update' : 'save reflection'}
      </Button>
    </div>
  )
}
