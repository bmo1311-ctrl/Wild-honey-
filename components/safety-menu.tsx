'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { EllipsisVertical, Flag, VolumeX, Ban } from 'lucide-react'
import { reportContent, toggleBlockUser, toggleMuteUser } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

export function SafetyMenu({
  authorId,
  contentType,
  contentId,
}: {
  authorId: string
  contentType: string
  contentId: string
}) {
  const [open, setOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [pending, startTransition] = useTransition()

  function handleBlock() {
    setOpen(false)
    startTransition(async () => {
      const res = await toggleBlockUser(authorId)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success(res.blocked ? "Blocked — you won't see each other's posts." : 'Unblocked.')
    })
  }

  function handleMute() {
    setOpen(false)
    startTransition(async () => {
      const res = await toggleMuteUser(authorId)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success(res.muted ? "Muted — you won't see their posts." : 'Unmuted.')
    })
  }

  function handleReport() {
    if (!reason.trim()) {
      toast.error('Tell us what the issue is.')
      return
    }
    startTransition(async () => {
      const res = await reportContent({ contentType, contentId, reason })
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success('Reported. Thank you for flagging this.')
      setReportOpen(false)
      setReason('')
    })
  }

  if (reportOpen) {
    return (
      <div className="mt-2 flex flex-col gap-2 rounded-xl bg-secondary/50 p-3">
        <p className="text-xs font-medium">what's wrong with this?</p>
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="tell us what you saw" />
        <div className="flex gap-2">
          <Button onClick={handleReport} disabled={pending} className="h-9 flex-1 text-xs">
            submit report
          </Button>
          <Button variant="ghost" onClick={() => setReportOpen(false)} className="h-9 text-xs">
            cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} className="text-muted-foreground">
        <EllipsisVertical className="h-4 w-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-6 z-20 flex w-44 flex-col overflow-hidden rounded-xl bg-card shadow-lg ring-1 ring-border">
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                setReportOpen(true)
              }}
              className="flex items-center gap-2 px-3 py-2.5 text-left text-xs font-medium hover:bg-secondary"
            >
              <Flag className="h-3.5 w-3.5" />
              report
            </button>
            <button type="button" onClick={handleMute} disabled={pending} className="flex items-center gap-2 px-3 py-2.5 text-left text-xs font-medium hover:bg-secondary">
              <VolumeX className="h-3.5 w-3.5" />
              mute this person
            </button>
            <button type="button" onClick={handleBlock} disabled={pending} className="flex items-center gap-2 px-3 py-2.5 text-left text-xs font-medium text-destructive hover:bg-secondary">
              <Ban className="h-3.5 w-3.5" />
              block this person
            </button>
          </div>
        </>
      )}
    </div>
  )
}
