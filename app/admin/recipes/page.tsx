import { AddRecipeForm } from '@/components/admin/recipe-form'
import { getRecipes } from '@/lib/data'

export default async function AdminRecipesPage() {
  const recipes = await getRecipes()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Recipes</h1>
        <p className="mt-1 text-sm text-muted-foreground">curate recipes members can browse, save, and cook from.</p>
      </div>
      <AddRecipeForm />
      <div className="flex flex-col gap-2">
        {recipes.map((r) => (
          <div key={r.id} className="flex items-center justify-between gap-3 rounded-xl bg-card p-3 ring-1 ring-border">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{r.title}</p>
              <p className="text-xs text-muted-foreground">
                {r.pillar ?? 'no pillar'} {r.prep_minutes ? `· ${r.prep_minutes} min` : ''}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
