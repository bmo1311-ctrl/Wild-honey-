'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { adminAddRecipe } from '@/app/actions'
import { ImageUploadField } from '@/components/admin/image-upload-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import type { Pillar } from '@/lib/types'

const PILLARS: Pillar[] = ['Body', 'Identity', 'Mindset', 'Faith']
const SEASONS = ['any', 'spring', 'summer', 'fall', 'winter']
const CYCLE_PHASES = ['any', 'menstrual', 'follicular', 'ovulation', 'luteal']
const BUDGETS = ['budget', 'moderate', 'splurge']

export function AddRecipeForm() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [ingredients, setIngredients] = useState('')
  const [instructions, setInstructions] = useState('')
  const [pillar, setPillar] = useState<Pillar | ''>('Body')
  const [prepMinutes, setPrepMinutes] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [isPremium, setIsPremium] = useState(true)
  const [season, setSeason] = useState('any')
  const [cyclePhase, setCyclePhase] = useState('any')
  const [budgetTier, setBudgetTier] = useState('moderate')
  const [proteinG, setProteinG] = useState('')
  const [nutritionHighlights, setNutritionHighlights] = useState('')
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
        season,
        cyclePhase,
        budgetTier,
        proteinG: proteinG ? parseFloat(proteinG) : undefined,
        nutritionHighlights,
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
      setProteinG('')
      setNutritionHighlights('')
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
      <div className="flex flex-col gap-1.5">
        <Label>nutrition highlights (e.g. "iron, B12, magnesium")</Label>
        <Input value={nutritionHighlights} onChange={(e) => setNutritionHighlights(e.target.value)} className="h-11" />
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
          <Input type="number" value={prepMinutes} onChange={(e) => setPrepMinutes(e.target.value)} className="h-11 w-24" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>protein (g)</Label>
          <Input type="number" value={proteinG} onChange={(e) => setProteinG(e.target.value)} className="h-11 w-24" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>paid only</Label>
          <div className="flex h-11 items-center">
            <Switch checked={isPremium} onCheckedChange={setIsPremium} />
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>season</Label>
          <select value={season} onChange={(e) => setSeason(e.target.value)} className="h-11 rounded-md border border-input bg-background px-3 text-sm">
            {SEASONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>cycle phase</Label>
          <select value={cyclePhase} onChange={(e) => setCyclePhase(e.target.value)} className="h-11 rounded-md border border-input bg-background px-3 text-sm">
            {CYCLE_PHASES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>budget</Label>
          <select value={budgetTier} onChange={(e) => setBudgetTier(e.target.value)} className="h-11 rounded-md border border-input bg-background px-3 text-sm">
            {BUDGETS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
      </div>
      <ImageUploadField value={imageUrl} onChange={setImageUrl} />
      <Button onClick={handleSubmit} disabled={pending} className="self-start">
        {pending ? 'adding…' : 'add recipe'}
      </Button>
    </div>
  )
}
