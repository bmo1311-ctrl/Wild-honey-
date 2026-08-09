'use client'

import { useState, useTransition } from 'react'
import { MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { addGroupPostComment, getGroupPostComments, toggleGroupPostReaction } from '@/app/actions'
import { BloomAvatar } from '@/components/bloom-avatar'
import { TierBadge } from '@/components/tier-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { HoneycombMark } from '@/components/logo'
import { SafetyMenu } from '@/components/safety-menu'
import type { GroupPost } from '@/lib/types'
import { relativeTime } from '@/lib/pillars'
import { cn } from '@/lib/utils'

export function GroupPostCard({ post }: { post: GroupPost }) {
  const [reacted, setReacted] = useState(Boolean(post.reacted_by_me))
  const [count, setCount] = useState(post.reaction_count ?? 0)
  const [commentCount, setCommentCount] = useState(post.comment_count ?? 0)
  const [open, setOpen] = useState(false)
  const [comments, setComments] = useState<any[]>([])
  const [draft, setDraft] = useState('')
  const [pending, startTransition] = useTransition()

  function handleReact() {
    const next = !reacted
    setReacted(next)
    setCount((c) => c + (next ? 1 : -1))
    startTransition(async () => {
      const res = await toggleGroupPostReaction(post.id)
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
      const data = await getGroupPostComments(post.id)
      setComments(data)
    }
  }

  function handleAddComment() {
    const text = draft.trim()
    if (!text) return
    startTransition(async () => {
      const res = await addGroupPostComment(post.id, text)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      setDraft('')
      setCommentCount((c) => c + 1)
      const data = await getGroupPostComments(post.id)
      setComments(data)
    })
  }

  return (
    <article className="rounded-2xl bg-card p-5 ring-1 ring-border">
      <header className="flex items-center gap-3">
        <BloomAvatar name={post.profile?.name ?? 'H'} color={post.profile?.avatar_color ?? 'honey'} avatarUrl={post.profile?.avatar_url} className="h-10 w-10" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="font-medium leading-tight">{post.profile?.name ?? 'A member'}</p>
            <TierBadge tier={post.profile?.membership_tier} />
          </div>
          <p className="text-xs text-muted-foreground">{relativeTime(post.created_at)}</p>
        </div>
        <SafetyMenu authorId={post.user_id} contentType="group_post" contentId={post.id} />
      </header>

      <p className="mt-3 whitespace-pre-wrap leading-relaxed text-pretty">{post.text}</p>

      <div className="mt-4 flex items-center gap-4 border-t border-border pt-3">
        <button
          type="button"
          onClick={handleReact}
          className={cn('flex items-center gap-1.5 text-sm font-medium transition-colors', reacted ? 'text-honey' : 'text-muted-foreground hover:text-foreground')}
          aria-pressed={reacted}
        >
          <HoneycombMark className={cn('h-6 w-6', reacted ? 'opacity-100' : 'opacity-60')} />
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
      </div>

      {open && (
        <div className="mt-4 flex flex-col gap-3">
          {comments.map((c) => (
            <div key={c.id} className="flex items-start gap-2.5">
              <BloomAvatar name={c.profile?.name ?? 'H'} color={c.profile?.avatar_color ?? 'honey'} avatarUrl={c.profile?.avatar_url} className="h-8 w-8 text-xs" />
              <div className="flex-1 rounded-2xl bg-secondary/70 px-3 py-2">
                <p className="text-xs font-medium">{c.profile?.name ?? 'A member'}</p>
                <p className="text-sm leading-snug text-pretty">{c.text}</p>
              </div>
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
              placeholder="reply..."
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
