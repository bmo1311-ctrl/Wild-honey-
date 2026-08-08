import { AddResourceForm } from '@/components/admin/resource-form'
import { getResources } from '@/lib/data'

export default async function AdminResourcesPage() {
  const resources = await getResources()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Resource Vault</h1>
        <p className="mt-1 text-sm text-muted-foreground">curate articles, videos, and tools members can browse and save.</p>
      </div>

      <AddResourceForm />

      <div className="flex flex-col gap-2">
        {resources.map((r) => (
          <div key={r.id} className="flex items-center justify-between gap-3 rounded-xl bg-card p-3 ring-1 ring-border">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{r.title}</p>
              <p className="text-xs text-muted-foreground">
                {r.resource_type} {r.pillar ? `· ${r.pillar}` : ''}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
