import { AddRetreatForm } from '@/components/admin/retreat-form'
import { CreateRetreatGroupButton } from '@/components/admin/create-retreat-group-button'
import { createClient } from '@/lib/supabase/server'
import { getRetreats } from '@/lib/data'
import { formatPrice } from '@/lib/pillars'

export default async function AdminRetreatsPage() {
  const retreats = await getRetreats()
  const supabase = await createClient()

  const signupsByRetreat: Record<string, { name: string; email: string | null; status: string }[]> = {}
  if (retreats.length > 0) {
    const { data: signups } = await supabase
      .from('retreat_signups')
      .select('retreat_id, status, profile:profiles(name, email)')
      .in('retreat_id', retreats.map((r) => r.id))
    ;(signups ?? []).forEach((s: any) => {
      signupsByRetreat[s.retreat_id] = signupsByRetreat[s.retreat_id] ?? []
      signupsByRetreat[s.retreat_id].push({
        name: s.profile?.name ?? 'unknown',
        email: s.profile?.email ?? null,
        status: s.status,
      })
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Retreats</h1>
        <p className="mt-1 text-sm text-muted-foreground">manage listings and see who's signed up.</p>
      </div>

      <AddRetreatForm />

      <div className="flex flex-col gap-4">
        {retreats.map((r) => (
          <div key={r.id} className="rounded-xl bg-card p-4 ring-1 ring-border">
            <div className="flex items-center justify-between">
              <p className="font-medium">{r.title}</p>
              <span className="text-xs text-muted-foreground">
                {r.spots_taken}/{r.spots_total} spots · {formatPrice(r.price_cents)}
              </span>
            </div>
            <div className="mt-3 flex flex-col gap-1.5">
              {(signupsByRetreat[r.id] ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground">no signups yet</p>
              ) : (
                signupsByRetreat[r.id].map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span>
                      {s.name} {s.email && <span className="text-muted-foreground">· {s.email}</span>}
                    </span>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground">
                      {s.status}
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className="mt-3">
              <CreateRetreatGroupButton retreatId={r.id} hasGroup={Boolean(r.group_id)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
