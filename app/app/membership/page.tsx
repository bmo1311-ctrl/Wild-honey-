import { Check } from 'lucide-react'
import { BuyButton } from '@/components/buy-button'
import { getSessionProfile } from '@/lib/data'

const TIERS = [
  {
    id: 'circle',
    name: 'The Circle',
    price: '$19/mo',
    features: ['Full prompt archive', 'All premium prompts', 'Share & react in the community feed'],
  },
  {
    id: 'inner-circle',
    name: 'Inner Circle',
    price: '$49/mo',
    features: ['Everything in The Circle', 'Monthly live Q&A access', 'Early retreat access'],
  },
]

export default async function MembershipPage() {
  const profile = await getSessionProfile()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-balance">Membership</h1>
        <p className="mt-1 text-sm text-muted-foreground">choose the level of support that fits you right now.</p>
      </div>

      {profile?.membership_tier === 'founder' && (
        <div className="rounded-2xl bg-[var(--founder)] p-5 text-center text-[var(--founder-foreground)]">
          <p className="font-serif text-lg font-semibold">You're the Founder</p>
          <p className="mt-1 text-sm opacity-80">highest access — full archive, pinning everywhere, and all paid content.</p>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        {TIERS.map((tier) => {
          const current = profile?.membership_tier === tier.id
          return (
            <div key={tier.id} className="flex flex-col gap-4 rounded-2xl bg-card p-6 ring-1 ring-border">
              <div>
                <h2 className="font-serif text-xl font-semibold">{tier.name}</h2>
                <p className="mt-1 font-serif text-2xl font-semibold text-honey">{tier.price}</p>
              </div>
              <ul className="flex flex-1 flex-col gap-2 text-sm text-muted-foreground">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-honey" />
                    <span className="text-pretty">{f}</span>
                  </li>
                ))}
              </ul>
              {current ? (
                <span className="rounded-full bg-secondary px-4 py-2.5 text-center text-sm font-medium text-secondary-foreground">
                  your current plan
                </span>
              ) : (
                <BuyButton kind="membership" tier={tier.id} label={`join ${tier.name}`} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
