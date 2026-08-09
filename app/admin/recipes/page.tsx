import { AddRecipeForm } from '@/components/admin/recipe-form'
import { RecipeRow } from '@/components/admin/recipe-row'
import { getRecipes } from '@/lib/data'

export default async function AdminRecipesPage() {
  const recipes = await getRecipes()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Recipes</h1>
        <p className="mt-1 text-sm text-muted-foreground">curate recipes members can browse, save, and cook from — tap any recipe to edit it.</p>
      </div>
      <AddRecipeForm />
      <div className="flex flex-col gap-2">
        {recipes.map((r) => (
          <RecipeRow key={r.id} recipe={r} />
        ))}
      </div>
    </div>
  )
}
