import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Calendar, Tent, Users } from 'lucide-react'
import { BuyButton } from '@/components/buy-button'
import { getRetreats } from '@/lib/data'
import { formatPrice } from '@/lib/pillars'
import { FeatureOff } from '@/components/feature-off'
import { FEATURES } from '@/lib/features'

export default async function RetreatsPage() {
  if (!FEATURES.retreats) return <FeatureOff />

  const retreats = await getRetreats()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-balance">Retreats</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          in-person time together — reserve a spot or join the waitlist.
        </p>
      </div>

      {retreats.length === 0 ? (
        <div className="rounded-2xl bg-card p-8 text-center ring-1 ring-border">
          <Tent className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">nothing on the calendar yet — check back soon.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {retreats.map((r) => {
            const full = r.spots_taken >= r.spots_total
            const spotsLeft = Math.max(0, r.spots_total - r.spots_taken)
            return (
              <div key={r.id} className="overflow-hidden rounded-2xl bg-card ring-1 ring-border">
                {r.cover_image && (
                  <div className="relative aspect-[16/9] w-full bg-secondary">
                    <Image src={r.cover_image} alt={r.title} fill className="object-cover" />
                  </div>
                )}
                <div className="flex flex-col gap-3 p-5">
                  <h2 className="font-serif text-xl font-semibold text-pretty">{r.title}</h2>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      {r.location}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {r.dates}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground text-pretty">{r.description}</p>
                  {r.group_id && r.my_group_membership && (
                    <Link href={`/app/groups/${r.group_id}`} className="flex w-fit items-center gap-1.5 rounded-full bg-honey/15 px-3 py-1.5 text-xs font-medium text-honey">
                      <Users className="h-3.5 w-3.5" />
                      go to attendee group
                    </Link>
                  )}
                  <div className="mt-1 flex items-center justify-between">
                    <div>
                      <span className="font-serif text-xl font-semibold">{formatPrice(r.price_cents)}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {full ? 'full — waitlist open' : `${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} left`}
                      </span>
                    </div>
                    {r.signed_up ? (
                      <span className="rounded-full bg-secondary px-4 py-2 text-xs font-medium text-secondary-foreground">
                        you're on the list
                      </span>
                    ) : (
                      <BuyButton
                        retreatId={r.id}
                        kind="retreat"
                        label={full ? 'join waitlist' : 'reserve spot'}
                      />
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
