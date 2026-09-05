'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Link2, X } from 'lucide-react'
import { previewRecipeFromUrl, saveOwnRecipe } from '@/app/actions'
import type { ImportedRecipe } from '@/lib/recipe-import'
import { cn } from '@/lib/utils'

/** Paste a link, check what came back, save it to her library. Share is a switch, off by default. */
export function RecipeImport() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [draft, setDraft] = useState<ImportedRecipe | null>(null)
  const [share, setShare] = useState(false)
  const [pending, startTransition] = useTransition()

  const field = 'h-11 w-full rounded-xl bg-background px-3 text-base outline-none ring-1 ring-border focus-visible:ring-2 focus-visible:ring-primary/40'
  const area = 'w-full rounded-xl bg-background p-3 text-[15px] leading-[1.5] outline-none ring-1 ring-border focus-visible:ring-2 focus-visible:ring-primary/40'

  function fetchIt() {
    startTransition(async () => {
      const res = await previewRecipeFromUrl(url)
      if ('error' in res && res.error) {
        toast.error(res.error)
        return
      }
      if ('recipe' in res && res.recipe) {
        setDraft(res.recipe)
        if (!res.recipe.complete) toast.message('Got the title — fill in the ingredients and steps.')
      }
    })
  }

  function save() {
    if (!draft) return
    startTransition(async () => {
      const res = await saveOwnRecipe({ ...draft, is_public: share })
      if ('error' in res && res.error) {
        toast.error(res.error)
        return
      }
      toast.success(share ? 'Saved and shared with the circle' : 'Saved to your recipes')
      setDraft(null)
      setUrl('')
      setOpen(false)
      router.refresh()
    })
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card text-[16px] font-semibold">
        <Link2 className="h-5 w-5" /> Add a recipe from a link
      </button>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-serif text-[17px] font-semibold">{draft ? 'Check it over' : 'Paste the link'}</p>
        <button type="button" onClick={() => { setOpen(false); setDraft(null) }} aria-label="Close">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {!draft ? (
        <div className="flex flex-col gap-2">
          <input value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchIt()} inputMode="url" placeholder="https://…" className={field} autoFocus />
          <button type="button" onClick={fetchIt} disabled={pending || !url.trim()} className="h-11 rounded-xl bg-primary text-[15px] font-bold text-primary-foreground disabled:opacity-50">
            {pending ? 'Reading the page…' : 'Get the recipe'}
          </button>
          <p className="text-xs text-muted-foreground">works with most recipe sites. if a page has no recipe data, you get the title and fill in the rest.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {draft.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={draft.image_url} alt="" className="aspect-video w-full rounded-xl object-cover" />
          )}
          <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className={field} placeholder="Title" />
          <textarea value={draft.ingredients} onChange={(e) => setDraft({ ...draft, ingredients: e.target.value })} rows={5} className={area} placeholder="Ingredients, one per line" />
          <textarea value={draft.instructions} onChange={(e) => setDraft({ ...draft, instructions: e.target.value })} rows={6} className={area} placeholder="Steps, one per line" />
          <div className="grid grid-cols-4 gap-2">
            {(['calories', 'protein_g', 'carbs_g', 'fat_g'] as const).map((k) => (
              <input key={k} value={draft[k] ?? ''} onChange={(e) => setDraft({ ...draft, [k]: e.target.value === '' ? null : Number(e.target.value) })} inputMode="decimal" placeholder={k.replace('_g', '')} className="h-11 w-full rounded-xl bg-background px-2 text-center text-base outline-none ring-1 ring-border" />
            ))}
          </div>
          <p className="text-[11.5px] text-muted-foreground">per serving, if the site gave them — leave blank otherwise.</p>
          {draft.source_name && <p className="text-xs text-muted-foreground">from {draft.source_name}</p>}

          <button type="button" onClick={() => setShare((v) => !v)} className={cn('flex items-center justify-between rounded-xl px-3 py-2.5 text-left ring-1', share ? 'bg-mindset-pillar text-white ring-transparent' : 'ring-border')}>
            <span className="text-sm font-medium">Share with the circle</span>
            <span className={cn('text-xs', share ? 'text-white/80' : 'text-muted-foreground')}>{share ? 'on — others can see it with your name' : 'off — only you'}</span>
          </button>

          <button type="button" onClick={save} disabled={pending} className="h-[52px] rounded-2xl bg-primary text-[17px] font-bold text-primary-foreground disabled:opacity-50">
            {pending ? 'Saving…' : 'Save to my recipes'}
          </button>
        </div>
      )}
    </div>
  )
}
