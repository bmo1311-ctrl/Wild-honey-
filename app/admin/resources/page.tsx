import { AddResourceForm } from '@/components/admin/resource-form'
import { ResourceRow } from '@/components/admin/resource-row'
import { getResources } from '@/lib/data'

export default async function AdminResourcesPage() {
  const resources = await getResources()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Resource Vault</h1>
        <p className="mt-1 text-sm text-muted-foreground">curate articles, videos, and guides — tap any resource to edit it.</p>
      </div>
      <AddResourceForm />
      <div className="flex flex-col gap-2">
        {resources.map((r) => (
          <ResourceRow key={r.id} resource={r} />
        ))}
      </div>
    </div>
  )
}
