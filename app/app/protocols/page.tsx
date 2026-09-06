import { ProtocolCard } from '@/components/protocol-card'
import { ProtocolTracker } from '@/components/protocol-tracker'
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
import type { ShelfItem } from '@/lib/routine'
import { planTonight } from '@/lib/tonight'
import { localToday } from '@/lib/today'
import { FeatureOff } from '@/components/feature-off'
import { FEATURES } from '@/lib/features'

/**
 * Two different things live here, and keeping them apart matters.
 *
 * Resets are time-boxed — five days, then done. Routines never end: they are
 * rebuilt every time she buys something, and they change with the season and
 * her cycle. Treating a skincare routine as a five-day protocol would have
 * fought the model forever.
 */
export default async function ProtocolsPage() {
  if (!FEATURES.protocols) return <FeatureOff />

  const [enrollment, todayCheckin, products, profile, log, today] = await Promise.all([
    getActiveEnrollment(),
    getTodayCheckin(),
    getMemberProducts('skin'),
    getSessionProfile(),
    getRoutineLog(30),
    localToday(),
  ])
  const completions = enrollment ? await getEnrollmentCompletions(enrollment.id) : []
  const activeProtocol = enrollment ? getProtocol(enrollment.protocol_slug) : null
  const suggestedSlug = suggestProtocol(todayCheckin)

  const shelf: ShelfItem[] = products.map((p) => ({
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
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Protocols</h1>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">
          resets for a season that needs one, routines for the things you do anyway.
        </p>
      </div>

      {/* Routines — ongoing, rebuilt from what she owns. */}
      <section>
        <h2 className="font-serif text-lg font-semibold">Skin</h2>
        <p className="mt-0.5 text-sm text-muted-foreground text-pretty">
          your products, in the order they actually go on.
        </p>

        {/*
          Where we stand on this, said once and plainly.

          "Clean" is unregulated — any brand can print it, and plenty charge a
          premium for the word. Naming what actually matters gives a member
          something she can use in a shop, instead of something to be afraid of.
        */}
        <p className="mb-4 mt-3 rounded-2xl bg-muted p-4 text-sm leading-relaxed text-pretty">
          <span className="font-medium">effective, transparent, affordable.</span>{' '}
          &ldquo;clean&rdquo; has no legal meaning — any brand can print it, and many charge you
          for the word. what matters is what is actually in the bottle, at a strength that does
          something, at a price you can keep paying. the same retinoid sits in a twelve dollar
          bottle and a ninety dollar one.
        </p>
        {tonight && (
          <div className="mb-5">
            <TonightCard plan={tonight} doneToday={doneTonight} />
          </div>
        )}
        <RoutineShelf shelf={shelf} lifeStage={profile?.life_stage ?? null} />
      </section>

      {/* Resets — time-boxed, and they end. */}
      <section>
        <h2 className="font-serif text-lg font-semibold">Resets</h2>
        <p className="mb-4 mt-0.5 text-sm text-muted-foreground text-pretty">
          a few days of small changes, for when something needs turning around.
        </p>

        {enrollment && activeProtocol && (
          <div className="mb-4">
            <ProtocolTracker enrollment={enrollment} protocol={activeProtocol} completions={completions} />
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {PROTOCOLS.filter((p) => p.slug !== enrollment?.protocol_slug).map((p) => (
            <ProtocolCard key={p.slug} protocol={p} suggested={!enrollment && p.slug === suggestedSlug} />
          ))}
        </div>
      </section>
    </div>
  )
}
