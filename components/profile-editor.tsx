'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { updateProfile } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { avatarColor, BloomAvatar } from '@/components/bloom-avatar'
import { cn } from '@/lib/utils'

const COLORS = ['honey', 'terracotta', 'sage', 'plum']

export function ProfileEditor({ name, avatarColor: initialColor }: { name: string; avatarColor: string }) {
  const [draftName, setDraftName] = useState(name)
  const [color, setColor] = useState(initialColor)
  const [pending, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      const res = await updateProfile({ name: draftName, avatarColor: color })
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success('Profile updated.')
    })
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-card p-5 ring-1 ring-border">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">display name</Label>
        <Input id="name" value={draftName} onChange={(e) => setDraftName(e.target.value)} className="h-11" />
      </div>
      <div className="flex flex-col gap-2">
        <Label>avatar color</Label>
        <div className="flex items-center gap-3">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={c}
              aria-pressed={color === c}
              onClick={() => setColor(c)}
              className={cn(
                'h-9 w-9 rounded-full ring-2 ring-offset-2 ring-offset-card transition-shadow',
                color === c ? 'ring-foreground' : 'ring-transparent',
              )}
              style={{ background: avatarColor(c) }}
            />
          ))}
          <BloomAvatar name={draftName} color={color} className="ml-2 h-9 w-9" />
        </div>
      </div>
      <Button onClick={handleSave} disabled={pending} className="self-start">
        {pending ? 'saving…' : 'save changes'}
      </Button>
    </div>
  )
}
