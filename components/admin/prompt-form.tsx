'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { adminAddPrompt, adminDeletePrompt } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import type { Pillar } from '@/lib/types'

const PILLARS: Pillar[] = ['Body', 'Identity', 'Mindset', 'Faith']

export function AddPromptForm() {
  const [pillar, setPillar] = useState<Pillar>('Identity')
  const [text, setText] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [premium, setPremium] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleSubmit() {
    if (!text.trim()) {
      toast.error('Write the prompt first.')
      return
    }
    startTransition(async () => {
      const res = await adminAddPrompt({ pillar, text, dateScheduled: date, isPremium: premium })
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success('Prompt added.')
      setText('')
    })
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-card p-5 ring-1 ring-border">
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>pillar</Label>
          <select
            value={pillar}
            onChange={(e) => setPillar(e.target.value as Pillar)}
            className="h-11 rounded-md border border-input bg-background px-3 text-sm"
          >
            {PILLARS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>premium</Label>
          <div className="flex h-11 items-center">
            <Switch checked={premium} onCheckedChange={setPremium} />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>prompt text</Label>
        <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} />
      </div>
      <Button onClick={handleSubmit} disabled={pending} className="self-start">
        {pending ? 'adding…' : 'add prompt'}
      </Button>
    </div>
  )
}

export function DeletePromptButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition()
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await adminDeletePrompt(id)
          if (res?.error) toast.error(res.error)
        })
      }
      className="text-xs font-medium text-muted-foreground hover:text-destructive"
    >
      remove
    </button>
  )
}
