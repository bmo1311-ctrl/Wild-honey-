'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { adminAddRecipe } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import type { Pillar } from '@/lib/types'

const PILLARS: Pillar[] = ['Body', 'Identity', 'Mindset', 'Faith']

export function AddRecipeForm() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [ingredients, setIngredients] = useState('')
  const [instructions, setInstructions] = useState('')
  const [pillar, setPillar] = useState<Pillar | ''>('')
  const [prepMinutes, setPrepMinutes] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [isPremium, setIsPremium] = useState(true)
  const [pending, startTransition] = useTransition()

  function handleSubmit() {
    if (!title.trim() || !ingredients.trim() || !instructions.trim()) {
      toast.error('Add a title, ingredients, and instructions first.')
      return
    }
    startTransition(async () => {
      const res = await adminAddRecipe({
        title,
        description,
        ingredients,
        instructions,
        pillar: pillar || undefined,
        prepMinutes: prepMinutes ? parseInt(prepMinutes, 10) : undefined,
        imageUrl,
        isPremium,
      })
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success('Recipe added.')
      setTitle('')
      setDescription('')
      setIngredients('')
      setInstructions('')
      setPrepMinutes('')
      setImageUrl('')
    })
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-card p-5 ring-1 ring-border">
      <p className="font-serif text-lg font-semibold">add recipe</p>
      <div className="flex flex-col gap-1.5">
        <Label>title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-11" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>description</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>ingredients</Label>
        <Textarea value={ingredients} onChange={(e) => setIngredients(e.target.value)} rows={4} placeholder="one per line" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>instructions</Label>
        <Textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={5} />
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>pillar</Label>
          <select value={pillar} onChange={(e) => setPillar(e.target.value as Pillar | '')} className="h-11 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">none</option>
            {PILLARS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>prep minutes</Label>
          <Input type="number" value={prepMinutes} onChange={(e) => setPrepMinutes(e.target.value)} className="h-11 w-28" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>paid only</Label>
          <div className="flex h-11 items-center">
            <Switch checked={isPremium} onCheckedChange={setIsPremium} />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>image URL</Label>
        <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="h-11" />
      </div>
      <Button onClick={handleSubmit} disabled={pending} className="self-start">
        {pending ? 'adding…' : 'add recipe'}
      </Button>
    </div>
  )
}
