import { adminGetMetrics } from '@/app/actions'

export default async function AdminOverviewPage() {
  const metrics = await adminGetMetrics()

  const cards = [
    { label: 'total members', value: metrics.totalMembers },
    { label: 'free', value: metrics.byTier.free ?? 0 },
    { label: 'circle', value: metrics.byTier.circle ?? 0 },
    { label: 'inner circle', value: metrics.byTier['inner-circle'] ?? 0 },
    { label: 'digital sales', value: metrics.totalPurchases },
    { label: 'entries this week', value: metrics.entriesThisWeek },
  ]

  const paidMembers = (metrics.byTier.circle ?? 0) + (metrics.byTier['inner-circle'] ?? 0)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">a quick pulse on the circle.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl bg-card p-4 ring-1 ring-border">
            <p className="font-serif text-2xl font-semibold">{c.value}</p>
            <p className="text-xs text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-secondary/60 p-5 text-sm text-muted-foreground">
        <p>
          <strong className="text-foreground">{paidMembers}</strong> paying members across Circle and Inner
          Circle. Add real MRR by pricing subscriptions in the Stripe dashboard — the numbers here reflect
          your own database, not Stripe's billing totals directly, so they'll stay accurate even before
          Stripe keys are added.
        </p>
      </div>
    </div>
  )
}
