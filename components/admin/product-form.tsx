'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { adminAddProduct } from '@/app/actions'
import { ImageUploadField } from '@/components/admin/image-upload-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export function AddProductForm() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [pending, startTransition] = useTransition()

  function handleSubmit() {
    const cents = Math.round(parseFloat(price || '0') * 100)
    if (!title.trim() || !cents) {
      toast.error('Add a title and a price first.')
      return
    }
    startTransition(async () => {
      const res = await adminAddProduct({
        title,
        description,
        priceCents: cents,
        coverImage,
        fileUrl,
      })
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success('Product added.')
      setTitle('')
      setDescription('')
      setPrice('')
      setCoverImage('')
      setFileUrl('')
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
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>price (USD)</Label>
          <Input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="h-11 w-32"
          />
        </div>
      </div>
      <ImageUploadField value={coverImage} onChange={setCoverImage} />
      <div className="flex flex-col gap-1.5">
        <Label>download file URL</Label>
        <Input
          value={fileUrl}
          onChange={(e) => setFileUrl(e.target.value)}
          className="h-11"
          placeholder="link to the PDF once it's uploaded somewhere"
        />
      </div>
      <Button onClick={handleSubmit} disabled={pending} className="self-start">
        {pending ? 'adding…' : 'add product'}
      </Button>
    </div>
  )
}
