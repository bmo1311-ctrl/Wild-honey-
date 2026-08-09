import Image from 'next/image'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { Wordmark, HoneycombMark } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { PILLAR_META, PILLARS } from '@/lib/pillars'

const TIERS = [
  {
    name: 'Free',
    price: '$0',
    cadence: 'forever',
    tier: 'free',
    features: ['The daily prompt', 'Your private journal', 'A read-only view of the circle'],
    cta: 'Start free',
    featured: false,
  },
  {
    name: 'The Circle',
    price: '$12',
    cadence: 'per month',
    tier: 'circle',
    features: [
      'Everything in Free',
      'Share entries with the circle',
      'Give honey & leave comments',
      'The full prompt archive',
      'Premium Faith prompts',
    ],
    cta: 'Join the Circle',
    featured: true,
  },
  {
    name: 'Inner Circle',
    price: '$29',
    cadence: 'per month',
    tier: 'inner-circle',
    features: [
      'Everything in The Circle',
      'Early access to retreats',
      'Members-only shop pricing',
      'Seasonal live gatherings',
    ],
    cta: 'Go Inner Circle',
    featured: false,
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Wordmark />
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link href="/auth/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/auth/sign-up">Join</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-6 pb-16 pt-8 md:grid-cols-2 md:pt-16">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-secondary-foreground">
            A daily practice for women
          </span>
          <h1 className="mt-5 font-serif text-4xl font-semibold leading-[1.05] tracking-tight text-balance sm:text-5xl md:text-6xl">
            Become rooted, one honest page at a time.
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground text-pretty">
            Wild Honey Circle is a daily journaling practice and a private community for women
            growing in Body, Identity, Mindset, and Faith. Show up softly. Grow wildly.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild className="h-12 px-7 text-base">
              <Link href="/auth/sign-up">Begin your practice</Link>
            </Button>
            <Button asChild variant="outline" className="h-12 px-7 text-base">
              <Link href="#membership">See membership</Link>
            </Button>
          </div>
        </div>
        <div className="relative">
          <div className="overflow-hidden rounded-3xl">
            <Image
              src="/hero.jpg"
              alt="A woman resting on a picnic blanket in the sun beside a basket of fresh fruit"
              width={720}
              height={820}
              priority
              className="h-full w-full object-cover"
            />
          </div>
          <div className="absolute -bottom-5 -left-5 hidden rounded-2xl bg-card px-5 py-4 shadow-lg ring-1 ring-border sm:block">
            <p className="font-serif text-2xl font-semibold">Day 1</p>
            <p className="text-xs text-muted-foreground">Your first prompt is waiting</p>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="border-t border-border bg-card/40">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="max-w-xl">
            <h2 className="font-serif text-3xl font-semibold text-balance">Four pillars of becoming</h2>
            <p className="mt-3 text-muted-foreground text-pretty">
              Every prompt belongs to one of four pillars, so your growth stays whole, not scattered.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PILLARS.map((p) => {
              const meta = PILLAR_META[p]
              return (
                <div key={p} className="rounded-2xl bg-card p-6 ring-1 ring-border">
                  <span className={`inline-block h-2.5 w-2.5 rounded-full ${meta.dot}`} />
                  <h3 className="mt-4 font-serif text-xl font-semibold">{p}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground text-pretty">
                    {meta.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Membership */}
      <section id="membership" className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="font-serif text-3xl font-semibold text-balance sm:text-4xl">
            Choose how deep you want to root
          </h2>
          <p className="mt-3 text-muted-foreground text-pretty">
            Start free and stay as long as you like. Upgrade whenever the circle calls you deeper.
          </p>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-3xl p-7 ring-1 ${
                tier.featured
                  ? 'bg-foreground text-background ring-foreground'
                  : 'bg-card ring-border'
              }`}
            >
              {tier.featured && (
                <span className="absolute -top-3 left-7 rounded-full bg-honey px-3 py-1 text-xs font-semibold uppercase tracking-wide text-honey-foreground">
                  Most loved
                </span>
              )}
              <h3 className="font-serif text-2xl font-semibold">{tier.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-serif text-4xl font-semibold">{tier.price}</span>
                <span className={tier.featured ? 'text-background/70' : 'text-muted-foreground'}>
                  {tier.cadence}
                </span>
              </div>
              <ul className="mt-6 flex flex-1 flex-col gap-3">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check
                      className={`mt-0.5 h-4 w-4 shrink-0 ${
                        tier.featured ? 'text-honey' : 'text-primary'
                      }`}
                    />
                    <span className={tier.featured ? 'text-background/90' : 'text-foreground'}>
                      {f}
                    </span>
                  </li>
                ))}
              </ul>
              <Button
                asChild
                variant={tier.featured ? 'secondary' : 'default'}
                className="mt-8 h-12 text-base"
              >
                <Link href="/auth/sign-up">{tier.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 py-10 text-center">
          <HoneycombMark className="h-9 w-9" />
          <p className="font-serif text-lg">Wild Honey Circle</p>
          <p className="max-w-sm text-sm text-muted-foreground text-pretty">
            Show up softly. Grow wildly. A gentle daily practice for women becoming who they are.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Wild Honey Circle
          </p>
        </div>
      </footer>
    </div>
  )
}
