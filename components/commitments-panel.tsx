'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Heart, Plus, X } from 'lucide-react'
import { addCommitment, deleteCommitment, reviewCommitment } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Commitment } from '@/lib/types'
import { cn } from '@/lib/utils'

const REVIEW_THRESHOLD_DAYS = 14

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
}

function CommitmentCard({ commitment }: { commitment: Commitment }) {
  const [mode, setMode] = useState<'idle' | 'reviewing' | 'modifying' | 'replacing'>('idle')
  const [text, setText] = useState('')
  const [pending, startTransition] = useTransition()
  const [dismissed, setDismissed] = useState(false)

  const needsReview = daysSince(commitment.last_reviewed_at) >= REVIEW_THRESHOLD_DAYS

  function act(action: 'continue' | 'modify' | 'release' | 'replace', newText?: string) {
    startTransition(async () => {
      const res = await reviewCommitment(commitment.id, action, newText)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      if (action === 'continue') toast.success('Still with you.')
      if (action === 'release') toast.success('Released — that\u2019s okay. You get to choose what you carry.')
      if (action === 'modify') toast.success('Updated.')
      if (action === 'replace') toast.success('Replaced with something new.')
      setMode('idle')
      setText('')
    })
  }

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteCommitment(commitment.id)
      if (res?.error) toast.error(res.error)
    })
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-secondary/40 p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-pretty">{commitment.text}</p>
        <button type="button" onClick={handleDelete} className="shrink-0 text-muted-foreground/60">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {needsReview && !dismissed && mode === 'idle' && (
        <div className="flex flex-col gap-2 rounded-lg bg-card p-3 ring-1 ring-border">
          <p className="text-xs font-medium">are you still committed to this?</p>
          <div className="flex flex-wrap gap-1.5">
            <button type="button" onClick={() => act('continue')} disabled={pending} className="rounded-full bg-honey/15 px-2.5 py-1 text-xs font-medium text-honey">
              yes, continue
            </button>
            <button type="button" onClick={() => setMode('modifying')} className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
              modify it
            </button>
            <button type="button" onClick={() => act('release')} disabled={pending} className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
              release it
            </button>
            <button type="button" onClick={() => setMode('replacing')} className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
              replace it
            </button>
          </div>
          <button type="button" onClick={() => setDismissed(true)} className="self-start text-[0.65rem] text-muted-foreground">
            ask me later
          </button>
        </div>
      )}

      {(mode === 'modifying' || mode === 'replacing') && (
        <div className="flex flex-col gap-2">
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder={mode === 'modifying' ? 'the updated wording' : 'the new commitment'} className="h-10" />
          <div className="flex gap-2">
            <Button onClick={() => act(mode === 'modifying' ? 'modify' : 'replace', text)} disabled={pending} size="sm" className="h-9">
              save
            </Button>
            <button type="button" onClick={() => setMode('idle')} className="text-xs text-muted-foreground">
              cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function CommitmentsPanel({ commitments }: { commitments: Commitment[] }) {
  const [adding, setAdding] = useState(false)
  const [text, setText] = useState('')
  const [pending, startTransition] = useTransition()

  const active = commitments.filter((c) => c.status === 'active')

  function handleAdd() {
    if (!text.trim()) {
      toast.error('Write your commitment first.')
      return
    }
    startTransition(async () => {
      const res = await addCommitment(text)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      setText('')
      setAdding(false)
      toast.success('Commitment set.')
    })
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-card p-5 ring-1 ring-border">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 font-serif text-lg font-semibold">
          <Heart className="h-4 w-4 text-honey" />
          my commitments
        </p>
        <button type="button" onClick={() => setAdding((a) => !a)} className="flex items-center gap-1 text-xs font-medium text-honey">
          <Plus className="h-3.5 w-3.5" />
          add
        </button>
      </div>

      {adding && (
        <div className="flex flex-col gap-2 rounded-xl bg-secondary/50 p-3">
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="I will..." className="h-10" />
          <Button onClick={handleAdd} disabled={pending} className="h-9 self-start text-xs">
            set commitment
          </Button>
        </div>
      )}

      {active.length === 0 ? (
        <p className="text-sm text-muted-foreground">nothing set yet — a commitment is just something you're choosing right now, not a promise you can't change.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {active.map((c) => (
            <CommitmentCard key={c.id} commitment={c} />
          ))}
        </div>
      )}
    </div>
  )
}
