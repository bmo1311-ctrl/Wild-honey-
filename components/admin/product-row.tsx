'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { Pencil, X } from 'lucide-react'
import { adminUpdateProduct } from '@/app/actions'
import { ImageUploadField } from '@/components/admin/image-upload-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import type { Product } from '@/lib/types'
import { formatPrice } from '@/lib/pillars'

export function ProductRow({ product }: { product: Product }) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(product.title)
  const [description, setDescription] = useState(product.description)
  const [priceDollars, setPriceDollars] = useState((product.price_cents / 100).toString())
  const [coverImage, setCoverImage] = useState(product.cover_image ?? '')
  const [fileUrl, setFileUrl] = useState(product.file_url ?? '')
  const [isPublished, setIsPublished] = useState(product.is_published)
  const [pending, startTransition] = useTransition()

  function handleSave() {
    if (!title.trim()) {
      toast.error('Give it a title first.')
      return
    }
    const cents = Math.round(parseFloat(priceDollars || '0') * 100)
    startTransition(async () => {
      const res = await adminUpdateProduct(product.id, {
        title,
        description,
        priceCents: cents,
        coverImage,
        fileUrl,
        isPublished,
      })
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success('Saved.')
      setEditing(false)
    })
  }

  if (!editing) {
    return (
      <div className="flex gap-3 rounded-xl bg-card p-3 ring-1 ring-border">
        {product.cover_image && (
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-secondary">
            <Image src={product.cover_image} alt="" fill className="object-cover" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{product.title}</p>
          <p className="text-xs text-muted-foreground">{formatPrice(product.price_cents)}</p>
          <p className="text-xs text-muted-foreground">{product.is_published ? 'published' : 'hidden'}</p>
        </div>
        <button type="button" onClick={() => setEditing(true)} className="shrink-0 self-start text-muted-foreground">
          <Pencil className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-card p-4 ring-1 ring-border">
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
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>price (USD)</Label>
          <Input type="number" step="0.01" value={priceDollars} onChange={(e) => setPriceDollars(e.target.value)} className="h-11 w-28" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>published</Label>
          <div className="flex h-11 items-center">
            <Switch checked={isPublished} onCheckedChange={setIsPublished} />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>file URL (what they get after buying)</Label>
        <Input value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} className="h-11" placeholder="https://..." />
      </div>
      <ImageUploadField value={coverImage} onChange={setCoverImage} />
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
