import { VaultBrowser } from '@/components/vault-browser'
import { buildShelves, buildVaultIndex } from '@/lib/vault'
import { getRecipes, getResources, getWorkouts } from '@/lib/data'
import { FeatureOff } from '@/components/feature-off'
import { FEATURES } from '@/lib/features'

export default async function VaultPage() {
  if (!FEATURES.vault) return <FeatureOff />

  const [resources, recipes, workouts] = await Promise.all([getResources(), getRecipes(), getWorkouts()])
  const items = buildVaultIndex({ resources, recipes, workouts })
  const shelves = buildShelves(items)

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-serif text-[29px] font-semibold leading-[1.1]">Vault</h1>
      <VaultBrowser shelves={shelves} all={items} />
    </div>
  )
}
