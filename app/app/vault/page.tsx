import { ResourceVault } from '@/components/resource-vault'
import { getResources } from '@/lib/data'
import { FeatureOff } from '@/components/feature-off'
import { FEATURES } from '@/lib/features'

export default async function VaultPage() {
  if (!FEATURES.vault) return <FeatureOff />

  const resources = await getResources()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Resource Vault</h1>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">articles, videos, and tools to go deeper on any of the four pillars.</p>
      </div>
      <ResourceVault resources={resources} />
    </div>
  )
}
