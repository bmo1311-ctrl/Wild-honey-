'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { createGroupPost } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

export function GroupPostComposer({ groupId }: { groupId: string }) {
  const [text, setText] = useState('')
  const [pending, startTransition] = useTransition()

  function handleSubmit() {
    if (!text.trim()) {
      toast.error('Write something first.')
      return
    }
    startTransition(async () => {
      const res = await createGroupPost(groupId, text)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      setText('')
      toast.success('Posted to the group.')
    })
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-card p-4 ring-1 ring-border">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="share something with this group..."
        rows={3}
        className="resize-none border-0 bg-transparent p-0 text-base leading-relaxed shadow-none focus-visible:ring-0"
      />
      <div className="flex items-center justify-end border-t border-border pt-3">
        <Button onClick={handleSubmit} disabled={pending} className="h-10">
          {pending ? 'posting…' : 'post'}
        </Button>
      </div>
    </div>
  )
}
