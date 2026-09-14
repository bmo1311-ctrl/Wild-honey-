import { ProtocolCard } from '@/components/protocol-card'
import { ProtocolTracker } from '@/components/protocol-tracker'
import { ProtocolNav } from '@/components/protocol-nav'
import { ProtocolChooser } from '@/components/protocol-chooser'
import { RoutineShelf } from '@/components/routine-shelf'
import { TonightCard } from '@/components/tonight-card'
import { WashCard } from '@/components/wash-card'
import { WashStrip } from '@/components/wash-strip'
import { WeekStrip } from '@/components/week-strip'
import { TreatmentSuggestions } from '@/components/treatment-suggestions'
import { SkinConcernsPanel } from '@/components/skin-concerns-panel'
import { treatmentSuggestions } from '@/lib/suggestions'
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
import { planTonight, planWeek } from '@/lib/tonight'
import { planWash, planWashDays } from '@/lib/wash-day'
import { localToday } from '@/lib/today'
import { FeatureOff } from '@/components/feature-off'
import { FEATURES } from '@/lib/features'
import { adultsOnly } from '@/lib/kid-guard'
import { getAccess } from '@/lib/data'
import { LockedArea } from '@/components/locked'

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
  await adultsOnly()
  const access = await getAccess()
  if (!access.paid)
    return (
      <LockedArea
        title="Protocols"
        subtitle="skin, hair and nails, on a rhythm rather than a whim."
        blurb="Tonight’s step decided for you, wash days worked out from what you use, the acids and actives libraries, the apothecary, and resets for the weeks that go sideways. Part of The Circle."
        from="protocols"
      />
    )
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
  for (const p of allProducts) {
    for (const d of p.domains?.length ? p.domains : [p.domain]) counts[d] = (counts[d] ?? 0) + 1
  }
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
              expectedGaps={area.gaps}
              dayParts={area.dayParts}
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
  expectedGaps,
  dayParts,
  allProducts,
  profile,
  log,
  today,
}: {
  areaKey: ProtocolArea
  categories: string[]
  expectedGaps: { category: string; note: string }[]
  dayParts: boolean
  allProducts: Awaited<ReturnType<typeof getMemberProducts>>
  profile: Awaited<ReturnType<typeof getSessionProfile>>
  log: Awaited<ReturnType<typeof getRoutineLog>>
  today: string
}) {
  // A product shows up in every area she uses it in. Castor oil belongs on
  // the hair shelf and the nail shelf at once; older rows only have `domain`.
  const shelf: ShelfItem[] = allProducts
    .filter((p) => (p.domains?.length ? p.domains.includes(areaKey as never) : p.domain === areaKey))
    .map((p) => ({
      id: p.id,
      name: p.custom_name ?? p.product?.name ?? 'a product',
      category: p.category ?? p.product?.category ?? null,
      actives: p.actives?.length ? p.actives : (p.product?.actives ?? []),
      timeOfDay: p.time_of_day,
      frequencyPerWeek: p.frequency_per_week,
    }))

  // Hair runs on washes, not nights — a different engine, not a tweak to the
  // skin one. Everything else keeps the nightly rhythm.
  const isHair = areaKey === 'hair'

  const wash = isHair && shelf.length > 0 ? planWash({ shelf, log, today }) : null
  const washDays = isHair && shelf.length > 0 ? planWashDays({ shelf, log, today }) : []
  const washedToday = wash ? log.some((l) => l.date === today && wash.steps.some((s) => s.id === l.memberProductId)) : false

  const tonight = !isHair && shelf.length > 0 ? planTonight({ shelf, log, today, allergies: profile?.allergies }) : null
  const week = !isHair && shelf.length > 0 ? planWeek({ shelf, log, today, allergies: profile?.allergies }) : []
  const doneTonight = log.some(
    (l) =>
      l.date === today &&
      (tonight?.kind === 'treatment'
        ? l.memberProductId === tonight.treatment?.id
        : l.ritualSlug === tonight?.ritual?.slug),
  )

  /*
   * Treatments she can do with nothing but a kitchen.
   *
   * Skin only — an oat soak is not a hair plan, and hair already has the wash
   * engine above. Offered hardest when the shelf is empty, because that is the
   * woman who has somewhere to start and no way to reach it: the six rituals
   * in lib/rituals.ts were only ever reachable through planTonight, which
   * needs products entered first.
   *
   * Anything she has done in the last week is dropped so the same mask is not
   * suggested two nights running.
   */
  const recentRituals = [...new Set(log.filter((l) => l.ritualSlug).map((l) => l.ritualSlug as string))].slice(0, 3)
  const treatments =
    areaKey === 'skin'
      ? treatmentSuggestions({
          allergies: profile?.allergies,
          recentRitualSlugs: recentRituals,
          today,
          shelfIsEmpty: shelf.length === 0,
        })
      : []

  return (
    <div className="flex flex-col gap-5">
      {/*
        Keyed on what the plan actually is, for the same reason as the shelf.
        `done` is useState(doneToday); logging a step revalidates, the engine
        recomputes to a different ritual, and the card kept showing the old
        one labelled "done tonight" with the button disabled — so she could
        not log the thing it was now telling her to do.
      */}
      {wash && <WashCard key={`${wash.reason}|${washedToday}`} plan={wash} doneToday={washedToday} />}
      {washDays.length > 0 && <WashStrip days={washDays} />}
      {tonight && (
        <TonightCard
          key={`${tonight.kind}|${tonight.treatment?.id ?? tonight.reason}|${doneTonight}`}
          plan={tonight}
          doneToday={doneTonight}
        />
      )}
      {week.length > 0 && <WeekStrip nights={week} />}

      {/*
        What she is working on comes before the shelf, because it decides
        what belongs on the shelf. Skin only — hair and nails have their own
        engines and their own vocabulary.
      */}
      {areaKey === 'skin' && (
        <SkinConcernsPanel
          initial={profile?.skin_concerns ?? []}
          lifeStage={profile?.life_stage ?? null}
        />
      )}

      {treatments.length > 0 && (
        <TreatmentSuggestions suggestions={treatments} shelfIsEmpty={shelf.length === 0} />
      )}

      {/*
        Keyed on the area, so switching Skin → Hair remounts it.

        The nav moves between areas with <Link>, which reconciles rather than
        remounts — so `categories` changed to the hair list while the picker's
        `category` state stayed on 'cleanser'. The select showed "shampoo"
        while the state said "cleanser", and adding a product filed it under a
        category that does not exist in Hair: `detectHairRole` then fell
        through to 'condition', the product never counted as a wash, and the
        shelf went on saying "no shampoo yet". `picked` and `alsoUsedIn`
        leaked across the same switch.
      */}
      <RoutineShelf
        key={areaKey}
        shelf={shelf}
        lifeStage={profile?.life_stage ?? null}
        domain={areaKey}
        categories={categories}
        expectedGaps={expectedGaps}
        dayParts={dayParts}
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
