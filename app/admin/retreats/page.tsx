import { AddRetreatForm } from '@/components/admin/retreat-form'
import { RetreatRow } from '@/components/admin/retreat-row'
import { createClient } from '@/lib/supabase/server'
import { getRetreats } from '@/lib/data'

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
          <RetreatRow key={r.id} retreat={r} signups={signupsByRetreat[r.id] ?? []} />
        ))}
      </div>
    </div>
  )
}
