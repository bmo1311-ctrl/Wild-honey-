'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { adminAddResource } from '@/app/actions'
import { ImageUploadField } from '@/components/admin/image-upload-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Pillar, ResourceType } from '@/lib/types'

const PILLARS: Pillar[] = ['Body', 'Identity', 'Mindset', 'Faith']
const TYPES: ResourceType[] = ['article', 'video', 'pdf', 'audio', 'link']

function youtubeThumbnail(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|live\/))([a-zA-Z0-9_-]{11})/)
  return match ? `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg` : null
}

export function AddResourceForm() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [url, setUrl] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [imageTouched, setImageTouched] = useState(false)
  const [resourceType, setResourceType] = useState<ResourceType>('article')
  const [pillar, setPillar] = useState<Pillar | ''>('')
  const [pending, startTransition] = useTransition()

  function handleUrlChange(next: string) {
    setUrl(next)
    if (!imageTouched) {
      const auto = youtubeThumbnail(next)
      if (auto) setImageUrl(auto)
    }
  }

  function handleImageChange(next: string) {
    setImageTouched(true)
    setImageUrl(next)
  }

  function handleSubmit() {
    if (!title.trim()) {
      toast.error('Add a title first.')
      return
    }
    startTransition(async () => {
      const res = await adminAddResource({ title, description, url, imageUrl, resourceType, pillar: pillar || undefined })
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success('Resource added.')
      setTitle('')
      setDescription('')
      setUrl('')
      setImageUrl('')
      setImageTouched(false)
    })
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-card p-5 ring-1 ring-border">
      <div className="flex flex-col gap-1.5">
        <Label>title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-11" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>description</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>URL</Label>
        <Input value={url} onChange={(e) => handleUrlChange(e.target.value)} className="h-11" placeholder="https://..." />
        <p className="text-[0.65rem] text-muted-foreground">paste a YouTube link and the thumbnail fills in automatically</p>
      </div>
      <ImageUploadField value={imageUrl} onChange={handleImageChange} />
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>type</Label>
          <select value={resourceType} onChange={(e) => setResourceType(e.target.value as ResourceType)} className="h-11 rounded-md border border-input bg-background px-3 text-sm">
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>pillar (optional)</Label>
          <select value={pillar} onChange={(e) => setPillar(e.target.value as Pillar | '')} className="h-11 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">none</option>
            {PILLARS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>
      <Button onClick={handleSubmit} disabled={pending} className="self-start">
        {pending ? 'adding…' : 'add resource'}
      </Button>
    </div>
  )
}
