import { ProtocolCard } from '@/components/protocol-card'
import { ProtocolTracker } from '@/components/protocol-tracker'
import { getActiveEnrollment, getEnrollmentCompletions, getTodayCheckin } from '@/lib/data'
import { PROTOCOLS, getProtocol, suggestProtocol } from '@/lib/protocols'

export default async function ProtocolsPage() {
  const [enrollment, todayCheckin] = await Promise.all([getActiveEnrollment(), getTodayCheckin()])
  const completions = enrollment ? await getEnrollmentCompletions(enrollment.id) : []
  const activeProtocol = enrollment ? getProtocol(enrollment.protocol_slug) : null
  const suggestedSlug = suggestProtocol(todayCheckin)

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Protocols</h1>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">structured, multi-day resets for whatever your body needs right now.</p>
      </div>

      {enrollment && activeProtocol && (
        <ProtocolTracker enrollment={enrollment} protocol={activeProtocol} completions={completions} />
      )}

      <div>
        <h2 className="mb-3 font-serif text-lg font-semibold">{enrollment ? 'other protocols' : 'choose a protocol'}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {PROTOCOLS.filter((p) => p.slug !== enrollment?.protocol_slug).map((p) => (
            <ProtocolCard key={p.slug} protocol={p} suggested={!enrollment && p.slug === suggestedSlug} />
          ))}
        </div>
      </div>
    </div>
  )
}
