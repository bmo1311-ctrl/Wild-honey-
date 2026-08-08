'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { adminAddWorkout, adminAddMealPlan, adminAddGroceryList } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import type { Pillar } from '@/lib/types'

const PILLARS: Pillar[] = ['Body', 'Identity', 'Mindset', 'Faith']

export function AddWorkoutForm() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [pillar, setPillar] = useState<Pillar>('Body')
  const [videoUrl, setVideoUrl] = useState('')
  const [instructions, setInstructions] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [pdfUrl, setPdfUrl] = useState('')
  const [isPremium, setIsPremium] = useState(true)
  const [pending, startTransition] = useTransition()

  function handleSubmit() {
    if (!title.trim()) {
      toast.error('Add a title first.')
      return
    }
    startTransition(async () => {
      const res = await adminAddWorkout({ title, description, pillar, videoUrl, instructions, imageUrl, pdfUrl, isPremium })
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success('Workout added.')
      setTitle('')
      setDescription('')
      setVideoUrl('')
      setInstructions('')
      setImageUrl('')
      setPdfUrl('')
    })
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-card p-5 ring-1 ring-border">
      <p className="font-serif text-lg font-semibold">add workout</p>
      <div className="flex flex-col gap-1.5">
        <Label>title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-11" />
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>pillar</Label>
          <select value={pillar} onChange={(e) => setPillar(e.target.value as Pillar)} className="h-11 rounded-md border border-input bg-background px-3 text-sm">
            {PILLARS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>paid only</Label>
          <div className="flex h-11 items-center">
            <Switch checked={isPremium} onCheckedChange={setIsPremium} />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>description</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>written instructions</Label>
        <Textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={4} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>video URL (YouTube/Vimeo link)</Label>
        <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} className="h-11" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>photo URL</Label>
        <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="h-11" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>PDF plan URL</Label>
        <Input value={pdfUrl} onChange={(e) => setPdfUrl(e.target.value)} className="h-11" />
      </div>
      <Button onClick={handleSubmit} disabled={pending} className="self-start">
        {pending ? 'adding…' : 'add workout'}
      </Button>
    </div>
  )
}

export function AddMealPlanForm() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [isPremium, setIsPremium] = useState(true)
  const [pending, startTransition] = useTransition()

  function handleSubmit() {
    if (!title.trim()) {
      toast.error('Add a title first.')
      return
    }
    startTransition(async () => {
      const res = await adminAddMealPlan({ title, description, content, fileUrl, isPremium })
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success('Meal plan added.')
      setTitle('')
      setDescription('')
      setContent('')
      setFileUrl('')
    })
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-card p-5 ring-1 ring-border">
      <p className="font-serif text-lg font-semibold">add meal plan</p>
      <div className="flex flex-col gap-1.5">
        <Label>title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-11" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>description</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>plan content (written out)</Label>
        <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={5} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>downloadable file URL</Label>
        <Input value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} className="h-11" />
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={isPremium} onCheckedChange={setIsPremium} />
        <Label>paid only</Label>
      </div>
      <Button onClick={handleSubmit} disabled={pending} className="self-start">
        {pending ? 'adding…' : 'add meal plan'}
      </Button>
    </div>
  )
}

export function AddGroceryListForm() {
  const [title, setTitle] = useState('')
  const [items, setItems] = useState('')
  const [isPremium, setIsPremium] = useState(true)
  const [pending, startTransition] = useTransition()

  function handleSubmit() {
    if (!title.trim() || !items.trim()) {
      toast.error('Add a title and the list itself.')
      return
    }
    startTransition(async () => {
      const res = await adminAddGroceryList({ title, items, isPremium })
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success('Grocery list added.')
      setTitle('')
      setItems('')
    })
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-card p-5 ring-1 ring-border">
      <p className="font-serif text-lg font-semibold">add grocery list</p>
      <div className="flex flex-col gap-1.5">
        <Label>title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-11" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>items (one per line)</Label>
        <Textarea value={items} onChange={(e) => setItems(e.target.value)} rows={6} />
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={isPremium} onCheckedChange={setIsPremium} />
        <Label>paid only</Label>
      </div>
      <Button onClick={handleSubmit} disabled={pending} className="self-start">
        {pending ? 'adding…' : 'add grocery list'}
      </Button>
    </div>
  )
}
