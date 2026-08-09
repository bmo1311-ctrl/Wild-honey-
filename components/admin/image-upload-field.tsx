'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { ImagePlus, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

export function ImageUploadField({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const supabase = createClient()
      const path = `uploads/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      const { error: uploadError } = await supabase.storage.from('site-images').upload(path, file)
      if (uploadError) {
        toast.error('Upload failed: ' + uploadError.message)
        return
      }
      const { data } = supabase.storage.from('site-images').getPublicUrl(path)
      onChange(data.publicUrl)
      toast.success('Photo uploaded.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label>cover image</Label>
      {value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className="h-32 w-full rounded-lg object-cover" />
      )}
      <div className="flex gap-2">
        <label className="flex h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md bg-secondary text-sm font-medium text-secondary-foreground">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          {uploading ? 'uploading…' : 'upload photo'}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePick} disabled={uploading} className="hidden" />
        </label>
      </div>
      <Input value={value} onChange={(e) => onChange(e.target.value)} className="h-9 text-xs" placeholder="or paste an image URL directly" />
    </div>
  )
}
