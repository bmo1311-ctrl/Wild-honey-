'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { adminAddChallenge } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Pillar } from '@/lib/types'

const PILLARS: Pillar[] = ['Body', 'Identity', 'Mindset', 'Faith']

export function AddChallengeForm() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [pillar, setPillar] = useState<Pillar | ''>('')
  const [lengthDays, setLengthDays] = useState('7')
  const [pending, startTransition] = useTransition()

  function handleSubmit() {
    if (!title.trim()) {
      toast.error('Give it a title first.')
      return
    }
    startTransition(async () => {
      const res = await adminAddChallenge({ title, description, pillar: pillar || undefined, lengthDays: parseInt(lengthDays, 10) || 7 })
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success('Challenge added.')
      setTitle('')
      setDescription('')
    })
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-card p-5 ring-1 ring-border">
      <p className="font-serif text-lg font-semibold">add challenge</p>
      <div className="flex flex-col gap-1.5">
        <Label>title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-11" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>description</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>pillar</Label>
          <select value={pillar} onChange={(e) => setPillar(e.target.value as Pillar | '')} className="h-11 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">none</option>
            {PILLARS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>length (days)</Label>
          <Input type="number" value={lengthDays} onChange={(e) => setLengthDays(e.target.value)} className="h-11 w-24" />
        </div>
      </div>
      <Button onClick={handleSubmit} disabled={pending} className="self-start">
        {pending ? 'adding…' : 'add challenge'}
      </Button>
    </div>
  )
}
