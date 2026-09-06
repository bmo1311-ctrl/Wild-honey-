import Image from 'next/image'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { Wordmark, HoneycombMark } from '@/components/logo'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PILLAR_META, PILLARS } from '@/lib/pillars'

const INSIDE = [
  {
    title: 'Three programs',
    body: 'Strong and Surrendered, Daily Bread, and The Honest Room. Written days, not videos you half-watch. Your writing is the work, and it counts itself.',
  },
  {
    title: 'A library that learns you',
    body: 'Teaching on identity, mindset and faith, plus worship and scripture for sleep. The shelves reorder around what you actually watch.',
  },
  {
    title: 'Nourish',
    body: 'Recipes, meal plans, grocery and pantry — and food logging that tracks every vitamin and mineral, adjusted for where you are in your cycle.',
  },
  {
    title: 'Your body, tracked gently',
    body: 'Workouts, daily check-ins, and multi-day resets for the weeks your energy or sleep goes sideways. No shrinking, no punishment.',
  },
  {
    title: 'Freedom',
    body: 'Your money, tracked and taught — because peace is not only spiritual, and most of us were never shown this part.',
  },
  {
    title: 'A circle, and a seat for your girl',
    body: 'Women doing the same work, plus a sign-in of her own so she grows up with the habits instead of inheriting the scramble.',
  },
]

const TIERS = [
  {
    name: 'Free',
    price: '$0',
    cadence: 'forever',
    tier: 'free',
    features: ['The daily prompt', 'Your private journal', 'Food and body logging', 'A read-only view of the circle'],
    cta: 'Start free',
    featured: false,
  },
  {
    name: 'The Circle',
    price: '$29',
    cadence: 'per month',
    tier: 'circle',
    features: [
      'All three programs, start to finish',
      'The whole teaching library',
      'Nourish — recipes, meal plans, grocery, pantry',
      'Every workout, and the routines that keep you well',
      'Freedom — your money, tracked and taught',
      'Learning boards and a sign-in for your child',
      'The Circle itself — post, comment, be known',
    ],
    cta: 'Join the Circle',
    featured: true,
  },
  {
    name: 'The Circle, yearly',
    price: '$290',
    cadence: 'per year',
    tier: 'circle',
    features: ['Everything in The Circle', 'Two months free', 'Your price, held'],
    cta: 'Join yearly',
    featured: false,
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Wordmark />
        <div className="flex items-center gap-2">
          <Link href="/auth/login" className={cn(buttonVariants({ variant: 'ghost' }), 'h-11 text-mindset-pillar')}>
            Sign in
          </Link>
          <Link href="/auth/sign-up" className={cn(buttonVariants())}>
            Join
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-6 pb-16 pt-8 md:grid-cols-2 md:pt-16">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-secondary-foreground">
            A whole-life practice for women
          </span>
          <h1 className="mt-5 font-serif text-4xl font-semibold leading-[1.05] tracking-tight text-balance sm:text-5xl md:text-6xl">
            Start with the body. The rest of the life is in here.
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground text-pretty">
            Most apps take one piece of you. This one holds all of it — what you eat and how you
            move, what you believe and what you carry, your money, your home, your daughter.
            Four pillars, three programs, and a circle of women doing the same. Show up softly.
            Grow wildly.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/auth/sign-up" className={cn(buttonVariants(), 'h-12 px-7 text-base')}>
              Begin your practice
            </Link>
            <Link href="#membership" className={cn(buttonVariants({ variant: 'outline' }), 'h-12 px-7 text-base')}>
              See membership
            </Link>
          </div>
          <p className="mt-4 text-center text-[15px] text-muted-foreground">
            Already a member?{' '}
            <Link href="/auth/login" className="font-semibold text-mindset-pillar underline underline-offset-[3px]">
              Sign in
            </Link>
          </p>
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
            <p className="text-xs text-muted-foreground">Your first page is waiting</p>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="border-t border-border bg-card/40">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="max-w-xl">
            <h2 className="font-serif text-3xl font-semibold text-balance">Four pillars of becoming</h2>
            <p className="mt-3 text-muted-foreground text-pretty">
              Everything in here belongs to one of four pillars, so your growth stays whole
              instead of scattered across five apps that do not talk to each other.
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

      {/* What is actually inside */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="max-w-xl">
          <h2 className="font-serif text-3xl font-semibold text-balance">What you actually get</h2>
          <p className="mt-3 text-muted-foreground text-pretty">
            Not a folder of PDFs. A place you open every morning.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {INSIDE.map((item) => (
            <div key={item.title} className="rounded-2xl bg-card p-6 ring-1 ring-border">
              <h3 className="font-serif text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground text-pretty">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Membership */}
      <section id="membership" className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="font-serif text-3xl font-semibold text-balance sm:text-4xl">
            Choose how deep you want to root
          </h2>
          <p className="mt-3 text-muted-foreground text-pretty">
            Start free and stay as long as you like. One membership opens everything — there is
            no higher tier to wonder about.
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
              <Link
                href="/auth/sign-up"
                className={cn(buttonVariants({ variant: tier.featured ? 'secondary' : 'default' }), 'mt-8 h-12 text-base')}
              >
                {tier.cta}
              </Link>
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
            Show up softly. Grow wildly. A whole-life practice for women becoming who they are.
          </p>
          <p className="text-sm">
            <Link href="/auth/login" className="font-medium text-mindset-pillar underline underline-offset-[3px]">
              Sign in
            </Link>
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Wild Honey Circle
          </p>
        </div>
      </footer>
    </div>
  )
}
