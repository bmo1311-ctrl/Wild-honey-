import { ReportCard } from '@/components/admin/report-card'
import { getReportsForAdmin } from '@/lib/data'

export default async function AdminReportsPage() {
  const reports = await getReportsForAdmin()
  const pending = reports.filter((r) => r.status === 'pending')
  const resolved = reports.filter((r) => r.status !== 'pending')

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">member-submitted reports across the Circle, Community, and Groups.</p>
      </div>

      <div>
        <h2 className="mb-3 font-serif text-lg font-semibold">pending ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground ring-1 ring-border">nothing waiting — nice.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {pending.map((r) => (
              <ReportCard key={r.id} report={r} />
            ))}
          </div>
        )}
      </div>

      {resolved.length > 0 && (
        <div>
          <h2 className="mb-3 font-serif text-lg font-semibold">resolved</h2>
          <div className="flex flex-col gap-3">
            {resolved.map((r) => (
              <ReportCard key={r.id} report={r} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
