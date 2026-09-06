import { ProtocolCard } from '@/components/protocol-card'
import { ProtocolTracker } from '@/components/protocol-tracker'
import { ProtocolNav } from '@/components/protocol-nav'
import { ProtocolChooser } from '@/components/protocol-chooser'
import { RoutineShelf } from '@/components/routine-shelf'
import { TonightCard } from '@/components/tonight-card'
import {
  getActiveEnrollment,
  getEnrollmentCompletions,
  getMemberProducts,
  getRoutineLog,
  getSessionProfile,
  getTodayCheckin,
} from '@/lib/data'
import { PROTOCOLS, getProtocol, suggestProtocol } from '@/lib/protocols'
import { AREAS, getArea, type ProtocolArea } from '@/lib/domains'
import type { ShelfItem } from '@/lib/routine'
import { planTonight } from '@/lib/tonight'
import { localToday } from '@/lib/today'
import { FeatureOff } from '@/components/feature-off'
import { FEATURES } from '@/lib/features'

/**
 * Protocols, one area at a time.
 *
 * It used to open straight into skincare, which assumed she came for
 * skincare — she might have come for her hair, or because the week went
 * sideways and she wants a reset. Now the area is a choice held in the URL,
 * and everything else is filtered away.
 *
 * The choice is only asked once. After that the page opens where her things
 * already are, because asking someone the same question every visit is its
 * own kind of friction.
 */
export default async function ProtocolsPage({
  searchParams,
}: {
  searchParams: Promise<{ area?: string }>
}) {
  if (!FEATURES.protocols) return <FeatureOff />

  const [{ area: requested }, enrollment, todayCheckin, allProducts, profile, log, today] = await Promise.all([
    searchParams,
    getActiveEnrollment(),
    getTodayCheckin(),
    getMemberProducts(),
    getSessionProfile(),
    getRoutineLog(30),
    localToday(),
  ])

  const counts: Record<string, number> = {}
  for (const p of allProducts) counts[p.domain] = (counts[p.domain] ?? 0) + 1
  if (enrollment) counts.resets = 1

  // Where to open when she has not said: wherever her things already are.
  const busiest = AREAS.filter((a) => a.key !== 'resets')
    .map((a) => ({ key: a.key, n: counts[a.key] ?? 0 }))
    .sort((a, b) => b.n - a.n)[0]
  const inferred: string | null =
    busiest && busiest.n > 0 ? busiest.key : enrollment ? 'resets' : null

  const area = getArea(requested ?? inferred ?? undefined)

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-serif text-3xl font-semibold">Protocols</h1>

      {/* Nothing set up anywhere yet — ask before assuming. */}
      {!area ? (
        <ProtocolChooser />
      ) : (
        <>
          <ProtocolNav active={area.key} counts={counts} />

          {area.key === 'resets' ? (
            <ResetsArea enrollment={enrollment} todayCheckin={todayCheckin} />
          ) : (
            <BeautyArea
              areaKey={area.key as ProtocolArea}
              categories={area.categories}
              allProducts={allProducts}
              profile={profile}
              log={log}
              today={today}
            />
          )}
        </>
      )}
    </div>
  )
}

/** One beauty area: tonight, the routine, and the shelf behind it. */
function BeautyArea({
  areaKey,
  categories,
  allProducts,
  profile,
  log,
  today,
}: {
  areaKey: ProtocolArea
  categories: string[]
  allProducts: Awaited<ReturnType<typeof getMemberProducts>>
  profile: Awaited<ReturnType<typeof getSessionProfile>>
  log: Awaited<ReturnType<typeof getRoutineLog>>
  today: string
}) {
  const shelf: ShelfItem[] = allProducts
    .filter((p) => p.domain === areaKey)
    .map((p) => ({
      id: p.id,
      name: p.custom_name ?? p.product?.name ?? 'a product',
      category: p.category ?? p.product?.category ?? null,
      actives: p.actives?.length ? p.actives : (p.product?.actives ?? []),
      timeOfDay: p.time_of_day,
      frequencyPerWeek: p.frequency_per_week,
    }))

  const tonight = shelf.length > 0 ? planTonight({ shelf, log, today, allergies: profile?.allergies }) : null
  const doneTonight = log.some(
    (l) =>
      l.date === today &&
      (tonight?.kind === 'treatment'
        ? l.memberProductId === tonight.treatment?.id
        : l.ritualSlug === tonight?.ritual?.slug),
  )

  return (
    <div className="flex flex-col gap-5">
      {tonight && <TonightCard plan={tonight} doneToday={doneTonight} />}

      <RoutineShelf
        shelf={shelf}
        lifeStage={profile?.life_stage ?? null}
        domain={areaKey}
        categories={categories}
      />
    </div>
  )
}

/** The time-boxed side: five days, then done. */
async function ResetsArea({
  enrollment,
  todayCheckin,
}: {
  enrollment: Awaited<ReturnType<typeof getActiveEnrollment>>
  todayCheckin: Awaited<ReturnType<typeof getTodayCheckin>>
}) {
  const completions = enrollment ? await getEnrollmentCompletions(enrollment.id) : []
  const activeProtocol = enrollment ? getProtocol(enrollment.protocol_slug) : null
  const suggestedSlug = suggestProtocol(todayCheckin)

  return (
    <div className="flex flex-col gap-4">
      {enrollment && activeProtocol && (
        <ProtocolTracker enrollment={enrollment} protocol={activeProtocol} completions={completions} />
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {PROTOCOLS.filter((p) => p.slug !== enrollment?.protocol_slug).map((p) => (
          <ProtocolCard key={p.slug} protocol={p} suggested={!enrollment && p.slug === suggestedSlug} />
        ))}
      </div>
    </div>
  )
}
