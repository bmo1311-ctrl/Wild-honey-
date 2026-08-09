'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Pencil, Trash2, X } from 'lucide-react'
import { adminDeleteWorkout, adminUpdateWorkout } from '@/app/actions'
import { ImageUploadField } from '@/components/admin/image-upload-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import type { Pillar, Workout } from '@/lib/types'

const PILLARS: Pillar[] = ['Body', 'Identity', 'Mindset', 'Faith']
const BODY_GROUPS = ['any', 'full_body', 'upper_body', 'lower_body', 'core', 'glutes', 'arms', 'back']
const WORKOUT_TYPES = ['any', 'strength', 'cardio', 'stretch', 'mobility', 'hiit', 'yoga', 'recovery']

export function WorkoutRow({ workout }: { workout: Workout }) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(workout.title)
  const [description, setDescription] = useState(workout.description)
  const [pillar, setPillar] = useState<Pillar>(workout.pillar)
  const [bodyGroup, setBodyGroup] = useState(workout.body_group ?? 'any')
  const [workoutType, setWorkoutType] = useState(workout.workout_type ?? 'any')
  const [videoUrl, setVideoUrl] = useState(workout.video_url ?? '')
  const [instructions, setInstructions] = useState(workout.instructions ?? '')
  const [imageUrl, setImageUrl] = useState(workout.image_url ?? '')
  const [pdfUrl, setPdfUrl] = useState(workout.pdf_url ?? '')
  const [isPremium, setIsPremium] = useState(workout.is_premium)
  const [pending, startTransition] = useTransition()
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  function handleSave() {
    if (!title.trim()) {
      toast.error('Give it a title first.')
      return
    }
    startTransition(async () => {
      const res = await adminUpdateWorkout(workout.id, { title, description, pillar, bodyGroup, workoutType, videoUrl, instructions, imageUrl, pdfUrl, isPremium })
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success('Workout updated.')
      setEditing(false)
    })
  }

  function handleDelete() {
    setDeleting(true)
    startTransition(async () => {
      const res = await adminDeleteWorkout(workout.id)
      setDeleting(false)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success('Workout deleted.')
    })
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-card p-3 ring-1 ring-border">
        {workout.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={workout.image_url} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{workout.title}</p>
          <p className="text-xs text-muted-foreground">
            {workout.body_group && workout.body_group !== 'any' ? workout.body_group.replace('_', ' ') : ''} {workout.workout_type && workout.workout_type !== 'any' ? `· ${workout.workout_type}` : ''}
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
        <Label>instructions</Label>
        <Textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={4} />
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>pillar</Label>
          <select value={pillar} onChange={(e) => setPillar(e.target.value as Pillar)} className="h-11 rounded-md border border-input bg-background px-3 text-sm">
            {PILLARS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>body group</Label>
          <select value={bodyGroup} onChange={(e) => setBodyGroup(e.target.value)} className="h-11 rounded-md border border-input bg-background px-3 text-sm">
            {BODY_GROUPS.map((b) => (
              <option key={b} value={b}>{b.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>workout type</Label>
          <select value={workoutType} onChange={(e) => setWorkoutType(e.target.value)} className="h-11 rounded-md border border-input bg-background px-3 text-sm">
            {WORKOUT_TYPES.map((w) => (
              <option key={w} value={w}>{w}</option>
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
        <Label>video URL</Label>
        <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} className="h-11" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>PDF URL</Label>
        <Input value={pdfUrl} onChange={(e) => setPdfUrl(e.target.value)} className="h-11" />
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
