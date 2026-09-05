import { VaultBrowser } from '@/components/vault-browser'
import { buildVaultIndex } from '@/lib/vault'
import { getRecipes, getResources, getWorkouts } from '@/lib/data'
import { FeatureOff } from '@/components/feature-off'
import { FEATURES } from '@/lib/features'

export default async function VaultPage() {
  if (!FEATURES.vault) return <FeatureOff />

  const [resources, recipes, workouts] = await Promise.all([getResources(), getRecipes(), getWorkouts()])
  const items = buildVaultIndex({ resources, recipes, workouts })

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-serif text-[29px] font-semibold leading-[1.1]">Vault</h1>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">
          everything in one place — {items.length} things to read, cook, move to, and come back to.
        </p>
      </div>
      <VaultBrowser items={items} />
    </div>
  )
}
