'use client'

import { useState, useTransition } from 'react'
import { MessageCircle, Pin } from 'lucide-react'
import { toast } from 'sonner'
import { addComment, getComments, toggleReaction, togglePinCircleEntry, togglePinCircleComment } from '@/app/actions'
import { BloomAvatar } from '@/components/bloom-avatar'
import { TierBadge } from '@/components/tier-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { HoneycombMark } from '@/components/logo'
import type { Comment, JournalEntry } from '@/lib/types'
import { PILLAR_META, relativeTime } from '@/lib/pillars'
import { cn } from '@/lib/utils'

export function CircleCard({ entry, canPin = false }: { entry: JournalEntry; canPin?: boolean }) {
  const [reacted, setReacted] = useState(Boolean(entry.reacted_by_me))
  const [count, setCount] = useState(entry.reaction_count ?? 0)
  const [commentCount, setCommentCount] = useState(entry.comment_count ?? 0)
  const [open, setOpen] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [draft, setDraft] = useState('')
  const [pinned, setPinned] = useState(Boolean((entry as any).pinned))
  const [pending, startTransition] = useTransition()

  const pillar = entry.prompt?.pillar

  function handleHoney() {
    const next = !reacted
    setReacted(next)
    setCount((c) => c + (next ? 1 : -1))
    startTransition(async () => {
      const res = await toggleReaction(entry.id)
      if (res?.error) {
        setReacted(!next)
        setCount((c) => c + (next ? -1 : 1))
        toast.error(res.error)
      }
    })
  }

  async function handleToggleComments() {
    const next = !open
    setOpen(next)
    if (next && comments.length === 0) {
      const data = await getComments(entry.id)
      setComments(data)
    }
  }

  function handleAddComment() {
    const text = draft.trim()
    if (!text) return
    startTransition(async () => {
      const res = await addComment(entry.id, text)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      setDraft('')
      setCommentCount((c) => c + 1)
      const data = await getComments(entry.id)
      setComments(data)
    })
  }

  function handlePinEntry() {
    const next = !pinned
    setPinned(next)
    startTransition(async () => {
      const res = await togglePinCircleEntry(entry.id)
      if (res?.error) {
        setPinned(!next)
        toast.error(res.error)
      }
    })
  }

  function handlePinComment(commentId: string) {
    startTransition(async () => {
      const res = await togglePinCircleComment(commentId)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      const data = await getComments(entry.id)
      setComments(data)
    })
  }

  return (
    <article className={cn('rounded-2xl bg-card p-5 ring-1', pinned ? 'ring-2 ring-primary' : 'ring-border')}>
      {pinned && (
        <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
          <Pin className="h-3 w-3" /> pinned
        </div>
      )}
      <header className="flex items-center gap-3">
        <BloomAvatar
          name={entry.profile?.name ?? 'H'}
          color={entry.profile?.avatar_color ?? 'honey'}
          className="h-10 w-10"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="font-medium leading-tight">{entry.profile?.name ?? 'A member'}</p>
            <TierBadge tier={(entry.profile as any)?.membership_tier} />
          </div>
          <p className="text-xs text-muted-foreground">{relativeTime(entry.created_at)}</p>
        </div>
        {pillar && (
          <span
            className={`rounded-full px-2.5 py-1 text-[0.7rem] font-medium ${PILLAR_META[pillar].chip}`}
          >
            {pillar}
          </span>
        )}
      </header>

      {entry.prompt && (
        <p className="mt-3 text-sm italic text-muted-foreground text-pretty">
          &ldquo;{entry.prompt.text}&rdquo;
        </p>
      )}
      <p className="mt-3 whitespace-pre-wrap leading-relaxed text-pretty">{entry.text}</p>

      <div className="mt-4 flex items-center gap-4 border-t border-border pt-3">
        <button
          type="button"
          onClick={handleHoney}
          className={cn(
            'flex items-center gap-1.5 text-sm font-medium transition-colors',
            reacted ? 'text-honey' : 'text-muted-foreground hover:text-foreground',
          )}
          aria-pressed={reacted}
        >
          <HoneycombMark
            className={cn('h-6 w-6', reacted ? 'opacity-100' : 'opacity-60')}
          />
          {count > 0 ? count : ''} honey
        </button>
        <button
          type="button"
          onClick={handleToggleComments}
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <MessageCircle className="h-4 w-4" />
          {commentCount > 0 ? commentCount : ''} reply
        </button>
        {canPin && (
          <button
            type="button"
            onClick={handlePinEntry}
            className={cn('ml-auto flex items-center gap-1.5 text-xs font-medium', pinned ? 'text-primary' : 'text-muted-foreground')}
          >
            <Pin className="h-3.5 w-3.5" />
            {pinned ? 'unpin' : 'pin'}
          </button>
        )}
      </div>

      {open && (
        <div className="mt-4 flex flex-col gap-3">
          {comments.map((c) => (
            <div key={c.id} className="flex items-start gap-2.5">
              <BloomAvatar
                name={c.profile?.name ?? 'H'}
                color={c.profile?.avatar_color ?? 'honey'}
                className="h-8 w-8 text-xs"
              />
              <div className={cn('flex-1 rounded-2xl px-3 py-2', (c as any).pinned ? 'bg-primary/10 ring-1 ring-primary/30' : 'bg-secondary/70')}>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-medium">{c.profile?.name ?? 'A member'}</p>
                  {(c as any).pinned && <Pin className="h-3 w-3 text-primary" />}
                </div>
                <p className="text-sm leading-snug text-pretty">{c.text}</p>
              </div>
              {canPin && (
                <button type="button" onClick={() => handlePinComment(c.id)} className="text-muted-foreground">
                  <Pin className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
          <div className="flex items-center gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229) {
                  e.preventDefault()
                  handleAddComment()
                }
              }}
              placeholder="Offer some warmth..."
              className="h-11 text-base"
            />
            <Button onClick={handleAddComment} disabled={pending} className="h-11 shrink-0">
              Send
            </Button>
          </div>
        </div>
      )}
    </article>
  )
}
