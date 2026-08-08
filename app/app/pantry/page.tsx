import { PantryList } from '@/components/pantry-list'
import { GroceryBuilder } from '@/components/grocery-builder'
import { getGroceryBuilderItems, getPantryItems } from '@/lib/data'

export default async function PantryPage() {
  const [pantryItems, groceryItems] = await Promise.all([getPantryItems(), getGroceryBuilderItems()])

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Pantry &amp; Grocery</h1>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">keep track of what you have, and build your shopping list around what you actually need.</p>
      </div>

      <GroceryBuilder items={groceryItems} />
      <PantryList items={pantryItems} />
    </div>
  )
}
