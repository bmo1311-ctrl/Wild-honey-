import Link from 'next/link'
import { Check } from 'lucide-react'
import { BuyButton } from '@/components/buy-button'
import { getAccess, getSessionProfile } from '@/lib/data'
import { stripeConfigured } from '@/lib/stripe'
import { MODULES } from '@/lib/modules'
import { TIER_RANK, type Tier } from '@/lib/access'

const FREE = [
  'Today, and what today needs',
  'Food logging with every vitamin and mineral',
  'Body: weight and tape, the trend line',
  'Check-ins, habits and your becoming',
  'Reading the Circle',
]

const TIERS: { id: Tier; name: string; price: string; features: string[] }[] = [
  {
    id: 'circle',
    name: 'The Circle',
    price: '$19/mo',
    features: [
      'Both programs — Strong and Surrendered, Daily Bread',
      'Watch: the whole teaching library',
      'Recipes, meal plans, grocery and pantry',
      'Every workout',
      'Freedom: your money, tracked and taught',
      'Learning boards and a sign-in for your child',
      'Post, comment and react in the Circle',
    ],
  },
  {
    id: 'inner-circle',
    name: 'Inner Circle',
    price: '$49/mo',
    features: ['Everything in The Circle', 'Ask the experts, and read every answer', 'Monthly live Q&A', 'Early retreat access'],
  },
]

export default async function MembershipPage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const { from } = await searchParams
  const [profile, access] = await Promise.all([getSessionProfile(), getAccess()])
  const fromTitle = from === 'ask' ? 'Ask the experts' : (MODULES.find((m) => m.key === from)?.title ?? null)
  const fromTier = from === 'ask' ? 'Inner Circle' : 'The Circle'
  const configured = stripeConfigured()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-balance">Membership</h1>
        <p className="mt-1 text-sm text-muted-foreground">start with the body. the rest of the life is in here.</p>
      </div>

      {fromTitle && (
        <p className="rounded-2xl border border-border bg-card px-4 py-3 text-[15px] leading-[1.45] text-pretty">
          <span className="font-semibold">{fromTitle}</span> is part of {fromTier}. Join and it opens right away.
        </p>
      )}

      {profile?.membership_tier === 'founder' && (
        <div className="rounded-2xl bg-[var(--founder)] p-5 text-center text-[var(--founder-foreground)]">
          <p className="font-serif text-lg font-semibold">You&rsquo;re the Founder</p>
          <p className="mt-1 text-sm opacity-80">everything, everywhere, and the pin.</p>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">free, always</p>
        <ul className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
          {FREE.map((f) => (
            <li key={f} className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-mindset-pillar" />
              <span className="text-pretty">{f}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {TIERS.map((tier) => {
          const current = access.tier === tier.id
          const included = TIER_RANK[access.tier] > TIER_RANK[tier.id]
          return (
            <div key={tier.id} className={`flex flex-col gap-4 rounded-2xl bg-card p-6 ring-1 ${current ? 'ring-2 ring-primary' : 'ring-border'}`}>
              <div>
                <h2 className="font-serif text-xl font-semibold">{tier.name}</h2>
                <p className="mt-1 font-serif text-2xl font-semibold">{tier.price}</p>
              </div>
              <ul className="flex flex-1 flex-col gap-2 text-sm text-muted-foreground">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-mindset-pillar" />
                    <span className="text-pretty">{f}</span>
                  </li>
                ))}
              </ul>
              {current ? (
                <span className="rounded-full bg-secondary px-4 py-2.5 text-center text-sm font-medium text-secondary-foreground">your current plan</span>
              ) : included ? (
                <span className="rounded-full bg-secondary px-4 py-2.5 text-center text-sm font-medium text-secondary-foreground">included in your plan</span>
              ) : (
                <BuyButton kind="membership" tier={tier.id} label={`join ${tier.name}`} />
              )}
            </div>
          )
        })}
      </div>

      {access.paid && access.tier !== 'founder' && (
        <Link href="/api/billing-portal" className="rounded-2xl bg-card p-4 text-center text-sm font-medium ring-1 ring-border">
          manage your membership
        </Link>
      )}

      {!configured && profile?.is_admin && (
        <p className="text-center text-xs text-muted-foreground text-pretty">
          Checkout isn&rsquo;t connected yet. Add the Stripe keys in Vercel and the join buttons go live.
        </p>
      )}
    </div>
  )
}
