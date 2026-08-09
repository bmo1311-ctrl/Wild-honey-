'use client'

import { useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { updateProfile } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { avatarColor, BloomAvatar } from '@/components/bloom-avatar'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const COLORS = ['sapphire', 'icyblue', 'emerald', 'fuchsia', 'crimson', 'lavender']

export function ProfileEditor({
  name,
  avatarColor: initialColor,
  avatarUrl: initialAvatarUrl,
}: {
  name: string
  avatarColor: string
  avatarUrl?: string | null
}) {
  const [draftName, setDraftName] = useState(name)
  const [color, setColor] = useState(initialColor)
  const [photoUrl, setPhotoUrl] = useState<string | null>(initialAvatarUrl ?? null)
  const [uploading, setUploading] = useState(false)
  const [pending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handlePickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const supabase = createClient()
      const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file)
      if (uploadError) {
        toast.error('Photo upload failed: ' + uploadError.message)
        return
      }
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      setPhotoUrl(data.publicUrl)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function handleSave() {
    startTransition(async () => {
      const res = await updateProfile({ name: draftName, avatarColor: color, avatarUrl: photoUrl })
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
        <Label>profile photo</Label>
        <div className="flex items-center gap-3">
          <BloomAvatar name={draftName} color={color} avatarUrl={photoUrl} className="h-16 w-16 text-xl" />
          <div className="flex flex-col gap-1.5">
            <label className="flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-secondary px-4 text-xs font-medium text-secondary-foreground">
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
              {uploading ? 'uploading…' : photoUrl ? 'change photo' : 'add photo'}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePickPhoto} disabled={uploading} className="hidden" />
            </label>
            {photoUrl && (
              <button type="button" onClick={() => setPhotoUrl(null)} className="flex items-center gap-1 text-xs text-muted-foreground">
                <X className="h-3 w-3" />
                remove photo
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>{photoUrl ? 'color (shown if you remove your photo)' : 'avatar color'}</Label>
        <div className="flex flex-wrap items-center gap-3">
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
        </div>
      </div>

      <Button onClick={handleSave} disabled={pending} className="self-start">
        {pending ? 'saving…' : 'save changes'}
      </Button>
    </div>
  )
}
