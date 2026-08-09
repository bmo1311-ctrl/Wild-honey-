'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Pencil, Trash2, X } from 'lucide-react'
import { adminDeleteResource, adminUpdateResource } from '@/app/actions'
import { ImageUploadField } from '@/components/admin/image-upload-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Pillar, Resource, ResourceType } from '@/lib/types'

const PILLARS: Pillar[] = ['Body', 'Identity', 'Mindset', 'Faith']
const TYPES: ResourceType[] = ['article', 'video', 'pdf', 'audio', 'link']

export function ResourceRow({ resource }: { resource: Resource }) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(resource.title)
  const [description, setDescription] = useState(resource.description ?? '')
  const [url, setUrl] = useState(resource.url ?? '')
  const [imageUrl, setImageUrl] = useState(resource.image_url ?? '')
  const [resourceType, setResourceType] = useState<ResourceType>(resource.resource_type)
  const [pillar, setPillar] = useState<Pillar | ''>(resource.pillar ?? '')
  const [pending, startTransition] = useTransition()
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  function handleSave() {
    if (!title.trim()) {
      toast.error('Give it a title first.')
      return
    }
    startTransition(async () => {
      const res = await adminUpdateResource(resource.id, { title, description, url, imageUrl, resourceType, pillar: pillar || undefined })
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success('Resource updated.')
      setEditing(false)
    })
  }

  function handleDelete() {
    setDeleting(true)
    startTransition(async () => {
      const res = await adminDeleteResource(resource.id)
      setDeleting(false)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success('Resource deleted.')
    })
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-card p-3 ring-1 ring-border">
        {resource.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={resource.image_url} alt="" className="h-12 w-16 shrink-0 rounded-md object-cover" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{resource.title}</p>
          <p className="text-xs text-muted-foreground">
            {resource.resource_type} {resource.pillar ? `· ${resource.pillar}` : ''}
          </p>
        </div>
        {confirmingDelete ? (
          <div className="flex shrink-0 items-center gap-1.5">
            <button type="button" onClick={handleDelete} disabled={deleting} className="rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
              {deleting ? 'deleting…' : 'confirm delete'}
            </button>
            <button type="button" onClick={() => setConfirmingDelete(false)} className="text-xs text-muted-foreground">
              cancel
            </button>
          </div>
        ) : (
          <>
            <button type="button" onClick={() => setEditing(true)} className="shrink-0 text-muted-foreground">
              <Pencil className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => setConfirmingDelete(true)} className="shrink-0 text-muted-foreground">
              <Trash2 className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-card p-4 ring-1 ring-border">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">editing</p>
        <button type="button" onClick={() => setEditing(false)} className="text-muted-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
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
        <Input value={url} onChange={(e) => setUrl(e.target.value)} className="h-11" />
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>type</Label>
          <select value={resourceType} onChange={(e) => setResourceType(e.target.value as ResourceType)} className="h-11 rounded-md border border-input bg-background px-3 text-sm">
            {TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>pillar</Label>
          <select value={pillar} onChange={(e) => setPillar(e.target.value as Pillar | '')} className="h-11 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">none</option>
            {PILLARS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>
      <ImageUploadField value={imageUrl} onChange={setImageUrl} />
      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={pending} className="h-10 flex-1">
          {pending ? 'saving…' : 'save changes'}
        </Button>
        <Button variant="ghost" onClick={() => setEditing(false)} className="h-10">
          cancel
        </Button>
      </div>
    </div>
  )
}
