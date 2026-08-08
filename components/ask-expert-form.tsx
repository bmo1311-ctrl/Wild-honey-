'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { submitExpertQuestion } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { PILLARS } from '@/lib/pillars'
import type { Pillar } from '@/lib/types'
import { cn } from '@/lib/utils'

export function AskExpertForm() {
  const [question, setQuestion] = useState('')
  const [pillar, setPillar] = useState<Pillar | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit() {
    if (!question.trim()) {
      toast.error('Write your question first.')
      return
    }
    startTransition(async () => {
      const res = await submitExpertQuestion({ question, pillar: pillar ?? undefined })
      if (res?.error) {
        toast.error(res.error)
        return
      }
      setQuestion('')
      setPillar(null)
      toast.success("Question sent — you'll see the answer here once it's ready.")
    })
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-card p-5 ring-1 ring-border">
      <p className="font-serif text-lg font-semibold">ask a question</p>
      <Textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="what's on your mind?" rows={3} />
      <div className="flex flex-wrap gap-1.5">
        {PILLARS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPillar(pillar === p ? null : p)}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-border transition-colors',
              pillar === p ? 'bg-foreground text-background ring-foreground' : 'bg-transparent text-muted-foreground',
            )}
          >
            {p}
          </button>
        ))}
      </div>
      <Button onClick={handleSubmit} disabled={pending} className="h-11 self-start">
        {pending ? 'sending…' : 'send question'}
      </Button>
    </div>
  )
}
