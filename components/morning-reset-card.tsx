'use client'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Sunrise, Check } from 'lucide-react'
import { saveMorningReset } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { MorningReset } from '@/lib/types'

export function MorningResetCard({ existing }: { existing: MorningReset | null }) {
  const [intention, setIntention] = useState(existing?.intention ?? '')
  const [gratitude, setGratitude] = useState(existing?.gratitude ?? '')
  const [done, setDone] = useState(Boolean(existing))
  const [expanded, setExpanded] = useState(!existing)
  const [pending, startTransition] = useTransition()

  function handleSave() {
    if (!intention.trim() || !gratitude.trim()) {
      toast.error('Fill in both fields — it only takes a moment.')
      return
    }
    startTransition(async () => {
      const res = await saveMorningReset({ intention, gratitude })
      if (res?.error) {
        toast.error(res.error)
        return
      }
      setDone(true)
      setExpanded(false)
      toast.success('Morning reset complete. Have a good one.')
    })
  }

  if (done && !expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="flex w-full items-center gap-3 rounded-2xl bg-card p-4 text-left ring-1 ring-border"
      >
        <span className="hex-clip flex h-9 w-9 shrink-0 items-center justify-center bg-honey text-honey-foreground">
          <Check className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">morning reset complete</p>
          <p className="truncate text-xs text-muted-foreground">{intention}</p>
        </div>
      </button>
    )
  }

  return (
    <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
      <div className="flex items-center gap-2">
        <Sunrise className="h-4 w-4 text-honey" />
        <p className="text-sm font-semibold">2-minute morning reset</p>
      </div>
      <div className="mt-4 flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">one intention for today</label>
          <Input value={intention} onChange={(e) => setIntention(e.target.value)} placeholder="e.g. move slowly, don't rush" className="h-11" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">one thing you're grateful for</label>
          <Input value={gratitude} onChange={(e) => setGratitude(e.target.value)} placeholder="e.g. coffee on the porch this morning" className="h-11" />
        </div>
      </div>
      <Button onClick={handleSave} disabled={pending} className="mt-4 h-11 w-full">
        {pending ? 'saving…' : done ? 'update' : 'complete reset'}
      </Button>
    </div>
  )
}
