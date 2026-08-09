'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Pencil, X } from 'lucide-react'
import { adminUpdateRecipe } from '@/app/actions'
import { ImageUploadField } from '@/components/admin/image-upload-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import type { Pillar, Recipe } from '@/lib/types'

const PILLARS: Pillar[] = ['Body', 'Identity', 'Mindset', 'Faith']
const SEASONS = ['any', 'spring', 'summer', 'fall', 'winter']
const CYCLE_PHASES = ['any', 'menstrual', 'follicular', 'ovulation', 'luteal']
const BUDGETS = ['budget', 'moderate', 'splurge']
const MEAL_TYPES = ['any', 'breakfast', 'lunch', 'dinner', 'snack', 'juice', 'mocktail']

function youtubeThumbnail(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|live\/))([a-zA-Z0-9_-]{11})/)
  return match ? `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg` : null
}

export function RecipeRow({ recipe }: { recipe: Recipe }) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(recipe.title)
  const [description, setDescription] = useState(recipe.description ?? '')
  const [ingredients, setIngredients] = useState(recipe.ingredients)
  const [instructions, setInstructions] = useState(recipe.instructions)
  const [pillar, setPillar] = useState<Pillar | ''>(recipe.pillar ?? '')
  const [prepMinutes, setPrepMinutes] = useState(recipe.prep_minutes?.toString() ?? '')
  const [imageUrl, setImageUrl] = useState(recipe.image_url ?? '')
  const [videoUrl, setVideoUrl] = useState(recipe.video_url ?? '')
  const [imageTouched, setImageTouched] = useState(false)
  const [isPremium, setIsPremium] = useState(recipe.is_premium)
  const [season, setSeason] = useState(recipe.season ?? 'any')
  const [cyclePhase, setCyclePhase] = useState(recipe.cycle_phase ?? 'any')
  const [budgetTier, setBudgetTier] = useState(recipe.budget_tier ?? 'moderate')
  const [mealType, setMealType] = useState(recipe.meal_type ?? 'any')
  const [kidFriendly, setKidFriendly] = useState(recipe.kid_friendly ?? false)
  const [proteinG, setProteinG] = useState(recipe.protein_g?.toString() ?? '')
  const [calories, setCalories] = useState(recipe.calories?.toString() ?? '')
  const [carbsG, setCarbsG] = useState(recipe.carbs_g?.toString() ?? '')
  const [fatG, setFatG] = useState(recipe.fat_g?.toString() ?? '')
  const [nutritionHighlights, setNutritionHighlights] = useState(recipe.nutrition_highlights ?? '')
  const [pending, startTransition] = useTransition()

  function handleVideoChange(next: string) {
    setVideoUrl(next)
    if (!imageTouched) {
      const auto = youtubeThumbnail(next)
      if (auto) setImageUrl(auto)
    }
  }

  function handleImageChange(next: string) {
    setImageTouched(true)
    setImageUrl(next)
  }

  function handleSave() {
    if (!title.trim() || !ingredients.trim() || !instructions.trim()) {
      toast.error('Title, ingredients, and instructions are required.')
      return
    }
    startTransition(async () => {
      const res = await adminUpdateRecipe(recipe.id, {
        title,
        description,
        ingredients,
        instructions,
        pillar: pillar || undefined,
        prepMinutes: prepMinutes ? parseInt(prepMinutes, 10) : undefined,
        imageUrl,
        videoUrl,
        isPremium,
        season,
        cyclePhase,
        budgetTier,
        mealType,
        kidFriendly,
        proteinG: proteinG ? parseFloat(proteinG) : undefined,
        calories: calories ? parseInt(calories, 10) : undefined,
        carbsG: carbsG ? parseFloat(carbsG) : undefined,
        fatG: fatG ? parseFloat(fatG) : undefined,
        nutritionHighlights,
      })
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success('Recipe updated.')
      setEditing(false)
    })
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-card p-3 ring-1 ring-border">
        {recipe.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={recipe.image_url} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{recipe.title}</p>
          <p className="text-xs text-muted-foreground">
            {recipe.pillar ?? 'no pillar'} {recipe.prep_minutes ? `· ${recipe.prep_minutes} min` : ''} {recipe.meal_type && recipe.meal_type !== 'any' ? `· ${recipe.meal_type}` : ''}
          </p>
        </div>
        <button type="button" onClick={() => setEditing(true)} className="shrink-0 text-muted-foreground">
          <Pencil className="h-4 w-4" />
        </button>
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
        <Label>ingredients</Label>
        <Textarea value={ingredients} onChange={(e) => setIngredients(e.target.value)} rows={4} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>instructions</Label>
        <Textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={5} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>nutrition highlights</Label>
        <Input value={nutritionHighlights} onChange={(e) => setNutritionHighlights(e.target.value)} className="h-11" />
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>pillar</Label>
          <select value={pillar} onChange={(e) => setPillar(e.target.value as Pillar | '')} className="h-11 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">none</option>
            {PILLARS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>prep minutes</Label>
          <Input type="number" value={prepMinutes} onChange={(e) => setPrepMinutes(e.target.value)} className="h-11 w-24" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>paid only</Label>
          <div className="flex h-11 items-center">
            <Switch checked={isPremium} onCheckedChange={setIsPremium} />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>kid-friendly</Label>
          <div className="flex h-11 items-center">
            <Switch checked={kidFriendly} onCheckedChange={setKidFriendly} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>season</Label>
          <select value={season} onChange={(e) => setSeason(e.target.value)} className="h-11 rounded-md border border-input bg-background px-3 text-sm">
            {SEASONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>cycle phase</Label>
          <select value={cyclePhase} onChange={(e) => setCyclePhase(e.target.value)} className="h-11 rounded-md border border-input bg-background px-3 text-sm">
            {CYCLE_PHASES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>budget</Label>
          <select value={budgetTier} onChange={(e) => setBudgetTier(e.target.value)} className="h-11 rounded-md border border-input bg-background px-3 text-sm">
            {BUDGETS.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>meal type</Label>
          <select value={mealType} onChange={(e) => setMealType(e.target.value)} className="h-11 rounded-md border border-input bg-background px-3 text-sm">
            {MEAL_TYPES.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>protein (g)</Label>
          <Input type="number" value={proteinG} onChange={(e) => setProteinG(e.target.value)} className="h-11 w-24" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>calories</Label>
          <Input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} className="h-11 w-24" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>carbs (g)</Label>
          <Input type="number" value={carbsG} onChange={(e) => setCarbsG(e.target.value)} className="h-11 w-24" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>fat (g)</Label>
          <Input type="number" value={fatG} onChange={(e) => setFatG(e.target.value)} className="h-11 w-24" />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>video URL</Label>
        <Input value={videoUrl} onChange={(e) => handleVideoChange(e.target.value)} className="h-11" placeholder="https://youtube.com/..." />
      </div>
      <ImageUploadField value={imageUrl} onChange={handleImageChange} />

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
