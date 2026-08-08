'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { adminAnswerQuestion, adminToggleQuestionPublic } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { ExpertQuestion } from '@/lib/types'
import { PILLAR_META, relativeTime } from '@/lib/pillars'
import { cn } from '@/lib/utils'

export function QuestionCard({ question }: { question: ExpertQuestion }) {
  const [answer, setAnswer] = useState(question.answer ?? '')
  const [isPublic, setIsPublic] = useState(question.is_public)
  const [pending, startTransition] = useTransition()

  function handleAnswer() {
    if (!answer.trim()) {
      toast.error('Write an answer first.')
      return
    }
    startTransition(async () => {
      const res = await adminAnswerQuestion(question.id, answer)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success('Answer saved.')
    })
  }

  function handleTogglePublic() {
    const next = !isPublic
    setIsPublic(next)
    startTransition(async () => {
      const res = await adminToggleQuestionPublic(question.id)
      if (res?.error) {
        setIsPublic(!next)
        toast.error(res.error)
      }
    })
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-card p-4 ring-1 ring-border">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {question.pillar && <span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-medium ${PILLAR_META[question.pillar].chip}`}>{question.pillar}</span>}
          <span className="text-xs text-muted-foreground">
            {question.profile?.name ?? 'a member'} · {relativeTime(question.created_at)}
          </span>
        </div>
        <button
          type="button"
          onClick={handleTogglePublic}
          className={cn('shrink-0 rounded-full px-2.5 py-1 text-[0.65rem] font-medium ring-1 ring-border', isPublic ? 'bg-honey/15 text-honey' : 'text-muted-foreground')}
        >
          {isPublic ? 'public' : 'private'}
        </button>
      </div>
      <p className="text-sm font-medium text-pretty">{question.question}</p>
      <Textarea value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="write your answer..." rows={3} />
      <Button onClick={handleAnswer} disabled={pending} className="h-10 self-start">
        {pending ? 'saving…' : question.answer ? 'update answer' : 'send answer'}
      </Button>
    </div>
  )
}
