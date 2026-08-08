'use client'

import { useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { ImagePlus, X } from 'lucide-react'
import { createCommunityPost } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { PILLARS } from '@/lib/pillars'
import type { Pillar } from '@/lib/types'
import { cn } from '@/lib/utils'

export function CommunityComposer() {
  const [text, setText] = useState('')
  const [pillar, setPillar] = useState<Pillar | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handlePickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function clearImage() {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleSubmit() {
    if (!text.trim() && !imageFile) {
      toast.error('Write something or add a photo first.')
      return
    }
    startTransition(async () => {
      let imageUrl: string | undefined
      if (imageFile) {
        const supabase = createClient()
        const path = `community/${Date.now()}-${imageFile.name}`
        const { error: uploadError } = await supabase.storage.from('community-images').upload(path, imageFile)
        if (uploadError) {
          toast.error(
            uploadError.message.includes('Bucket not found')
              ? 'Photo storage isn\u2019t set up yet \u2014 posting without the photo.'
              : 'Photo upload failed \u2014 posting without it.',
          )
        } else {
          const { data } = supabase.storage.from('community-images').getPublicUrl(path)
          imageUrl = data.publicUrl
        }
      }
      const res = await createCommunityPost({ text, imageUrl, pillar: pillar ?? undefined })
      if (res?.error) {
        toast.error(res.error)
        return
      }
      setText('')
      clearImage()
      setPillar(null)
      toast.success('Posted to the community.')
    })
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-card p-4 ring-1 ring-border">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="share something with the circle..."
        rows={3}
        className="resize-none border-0 bg-transparent p-0 text-base leading-relaxed shadow-none focus-visible:ring-0"
      />
      {imagePreview && (
        <div className="relative w-fit">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imagePreview} alt="" className="max-h-56 rounded-xl object-cover" />
          <button
            type="button"
            onClick={clearImage}
            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-background"
            aria-label="Remove photo"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {PILLARS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPillar(pillar === p ? null : p)}
            className={cn(
              'rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-border transition-colors',
              pillar === p ? 'bg-foreground text-background ring-foreground' : 'bg-transparent text-muted-foreground',
            )}
          >
            {p}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-border pt-3">
        <label className="flex cursor-pointer items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <ImagePlus className="h-4 w-4" />
          photo
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePickImage} className="hidden" />
        </label>
        <Button onClick={handleSubmit} disabled={pending} className="h-10">
          {pending ? 'posting…' : 'post'}
        </Button>
      </div>
    </div>
  )
}
