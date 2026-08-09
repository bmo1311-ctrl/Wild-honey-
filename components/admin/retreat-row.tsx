'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Pencil, X } from 'lucide-react'
import { adminUpdateRetreat } from '@/app/actions'
import { CreateRetreatGroupButton } from '@/components/admin/create-retreat-group-button'
import { ImageUploadField } from '@/components/admin/image-upload-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Retreat } from '@/lib/types'
import { formatPrice } from '@/lib/pillars'

export function RetreatRow({ retreat, signups }: { retreat: Retreat; signups: { name: string; email: string | null; status: string }[] }) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(retreat.title)
  const [location, setLocation] = useState(retreat.location)
  const [dates, setDates] = useState(retreat.dates)
  const [description, setDescription] = useState(retreat.description)
  const [priceDollars, setPriceDollars] = useState((retreat.price_cents / 100).toString())
  const [spotsTotal, setSpotsTotal] = useState(retreat.spots_total.toString())
  const [coverImage, setCoverImage] = useState(retreat.cover_image ?? '')
  const [pending, startTransition] = useTransition()

  function handleSave() {
    if (!title.trim()) {
      toast.error('Give it a title first.')
      return
    }
    const cents = Math.round(parseFloat(priceDollars || '0') * 100)
    startTransition(async () => {
      const res = await adminUpdateRetreat(retreat.id, {
        title,
        location,
        dates,
        description,
        priceCents: cents,
        spotsTotal: parseInt(spotsTotal, 10) || 0,
        coverImage,
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
      <div className="rounded-xl bg-card p-4 ring-1 ring-border">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium">{retreat.title}</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {retreat.spots_taken}/{retreat.spots_total} spots · {formatPrice(retreat.price_cents)}
            </span>
            <button type="button" onClick={() => setEditing(true)} className="shrink-0 text-muted-foreground">
              <Pencil className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="mt-3 flex flex-col gap-1.5">
          {signups.length === 0 ? (
            <p className="text-xs text-muted-foreground">no signups yet</p>
          ) : (
            signups.map((s, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span>
                  {s.name} {s.email && <span className="text-muted-foreground">· {s.email}</span>}
                </span>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground">{s.status}</span>
              </div>
            ))
          )}
        </div>
        <div className="mt-3">
          <CreateRetreatGroupButton retreatId={retreat.id} hasGroup={Boolean(retreat.group_id)} />
        </div>
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
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>location</Label>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} className="h-11" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>dates</Label>
          <Input value={dates} onChange={(e) => setDates(e.target.value)} className="h-11" />
        </div>
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
          <Label>total spots</Label>
          <Input type="number" value={spotsTotal} onChange={(e) => setSpotsTotal(e.target.value)} className="h-11 w-24" />
        </div>
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
