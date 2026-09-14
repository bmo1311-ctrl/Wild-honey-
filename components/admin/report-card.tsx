'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { adminRemoveReportedContent, adminReviewReport } from '@/app/actions'
import type { ContentReport } from '@/lib/types'
import { relativeTime } from '@/lib/pillars'
import { cn } from '@/lib/utils'

export function ReportCard({ report }: { report: ContentReport }) {
  const [status, setStatus] = useState(report.status)
  const [pending, startTransition] = useTransition()

  function handleDismiss() {
    startTransition(async () => {
      const res = await adminReviewReport(report.id, 'dismissed')
      if (res?.error) {
        toast.error(res.error)
        return
      }
      setStatus('dismissed')
      toast.success('Dismissed.')
    })
  }

  function handleReviewed() {
    startTransition(async () => {
      const res = await adminReviewReport(report.id, 'reviewed')
      if (res?.error) {
        toast.error(res.error)
        return
      }
      setStatus('reviewed')
      toast.success('Marked reviewed.')
    })
  }

  function handleRemove() {
    startTransition(async () => {
      const res = await adminRemoveReportedContent(report.id)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      setStatus('removed')
      toast.success('Content removed.')
    })
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-card p-4 ring-1 ring-border">
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full bg-secondary px-2 py-0.5 text-[0.65rem] font-medium text-secondary-foreground">{report.content_type.replace(/_/g, ' ')}</span>
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-[0.65rem] font-medium',
            status === 'pending' ? 'bg-destructive/10 text-destructive' : 'bg-honey/15 text-honey',
          )}
        >
          {status}
        </span>
      </div>
      <p className="text-sm text-pretty">{report.reason}</p>
      <p className="text-xs text-muted-foreground">
        reported by {report.reporter_profile?.name ?? 'a member'} · {relativeTime(report.created_at)}
      </p>

      {/*
        The reported content, which this card did not show at all.

        "remove content" deleted something permanently on one member's
        description of it. The reason above is the accusation; this is the
        thing itself, and deciding between the two without it is not really
        deciding.

        A gone row is said plainly rather than rendered as an empty box —
        "already gone" is the answer to why the remove button is missing.
      */}
      {report.content_text === undefined ? (
        <p className="rounded-lg bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
          this content is already gone — deleted by its author, or removed earlier.
        </p>
      ) : (
        <div className="rounded-lg bg-secondary/60 px-3 py-2">
          <p className="text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
            {report.content_author_name ?? 'a member'} wrote
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-pretty">
            {report.content_text.trim() ? report.content_text : '(no text — an image or an empty post)'}
          </p>
        </div>
      )}

      {status === 'pending' && (
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={handleDismiss} disabled={pending} className="rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground">
            dismiss
          </button>
          <button type="button" onClick={handleReviewed} disabled={pending} className="rounded-full bg-honey/15 px-3 py-1.5 text-xs font-medium text-honey">
            mark reviewed
          </button>
          {report.content_text !== undefined && (
            <button type="button" onClick={handleRemove} disabled={pending} className="rounded-full bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive">
              remove content
            </button>
          )}
        </div>
      )}
    </div>
  )
}
