'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { adminAddRetreat } from '@/app/actions'
import { ImageUploadField } from '@/components/admin/image-upload-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export function AddRetreatForm() {
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [dates, setDates] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [spots, setSpots] = useState('12')
  const [coverImage, setCoverImage] = useState('')
  const [pending, startTransition] = useTransition()

  function handleSubmit() {
    const cents = Math.round(parseFloat(price || '0') * 100)
    if (!title.trim() || !cents) {
      toast.error('Add a title and a price first.')
      return
    }
    startTransition(async () => {
      const res = await adminAddRetreat({
        title,
        location,
        dates,
        description,
        priceCents: cents,
        spotsTotal: parseInt(spots, 10) || 12,
        coverImage,
      })
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success('Retreat added.')
      setTitle('')
      setLocation('')
      setDates('')
      setDescription('')
      setPrice('')
      setCoverImage('')
    })
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-card p-5 ring-1 ring-border">
      <div className="flex flex-col gap-1.5">
        <Label>title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-11" />
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label>location</Label>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} className="h-11" />
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <Label>dates</Label>
          <Input value={dates} onChange={(e) => setDates(e.target.value)} className="h-11" placeholder="Jul 19–23" />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>description</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>price (USD)</Label>
          <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="h-11 w-32" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>total spots</Label>
          <Input type="number" value={spots} onChange={(e) => setSpots(e.target.value)} className="h-11 w-24" />
        </div>
      </div>
      <ImageUploadField value={coverImage} onChange={setCoverImage} />
      <Button onClick={handleSubmit} disabled={pending} className="self-start">
        {pending ? 'adding…' : 'add retreat'}
      </Button>
    </div>
  )
}
