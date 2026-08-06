'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Lock, Users } from 'lucide-react'
import { saveEntry } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { JournalEntry, Visibility } from '@/lib/types'
import { cn } from '@/lib/utils'

export function JournalComposer({
  promptId,
  existing,
}: {
  promptId: string | null
  existing: JournalEntry | null
}) {
  const [text, setText] = useState(existing?.text ?? '')
  const [visibility, setVisibility] = useState<Visibility>(existing?.visibility ?? 'private')
  const [saved, setSaved] = useState(Boolean(existing))
  const [pending, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      const res = await saveEntry({
        promptId,
        text,
        visibility,
        entryId: existing?.id,
      })
      if (res?.error) {
        toast.error(res.error)
        return
      }
      setSaved(true)
      toast.success(
        visibility === 'circle' ? 'Shared with the circle.' : 'Saved to your journal.',
      )
    })
  }

  return (
    <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
      <Textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          setSaved(false)
        }}
        placeholder="Let it be honest. No one is grading this."
        rows={7}
        className="resize-none border-0 bg-transparent p-0 text-base leading-relaxed shadow-none focus-visible:ring-0"
      />
      <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <VisibilityToggle
            active={visibility === 'private'}
            onClick={() => {
              setVisibility('private')
              setSaved(false)
            }}
            icon={<Lock className="h-3.5 w-3.5" />}
            label="Private"
          />
          <VisibilityToggle
            active={visibility === 'circle'}
            onClick={() => {
              setVisibility('circle')
              setSaved(false)
            }}
            icon={<Users className="h-3.5 w-3.5" />}
            label="Share with circle"
          />
        </div>
        <Button onClick={handleSave} disabled={pending || (saved && Boolean(existing))} className="h-11">
          {pending ? 'Saving...' : saved ? 'Saved' : existing ? 'Update entry' : 'Save entry'}
        </Button>
      </div>
    </div>
  )
}

function VisibilityToggle({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
        active
          ? 'bg-foreground text-background'
          : 'bg-secondary text-secondary-foreground hover:bg-accent',
      )}
    >
      {icon}
      {label}
    </button>
  )
}
