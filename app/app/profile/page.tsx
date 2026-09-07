import Link from 'next/link'
import {
  Archive,
  BookMarked,
  CalendarDays,
  ChefHat,
  ClipboardList,
  Dumbbell,
  Flame,
  GraduationCap,
  Heart,
  HelpCircle,
  LogOut,
  PenLine,
  PhoneCall,
  Refrigerator,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Target,
  Tent,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react'
import { signOut } from '@/app/actions'
import { HoneyProfileCard } from '@/components/honey-profile-card'
import { BloomAvatar } from '@/components/bloom-avatar'
import { TierBadge } from '@/components/tier-badge'
import { ClosetShelf } from '@/components/closet'
import { getMyEntries, getMyGoals, getSessionProfile, getVitalityHistory } from '@/lib/data'
import { SQUARE_LINKS } from '@/lib/payment-links'
import { relativeTime } from '@/lib/pillars'
import { FEATURES } from '@/lib/features'

/**
 * Her page, as a closet rather than a filing cabinet.
 *
 * It used to be twenty-one identical grey rows with a chevron on each, and
 * half of them were not hers — workouts, recipes, retreats, the shop. A page
 * called "You" that is mostly a menu of things for sale is a hard page to
 * love, and impossible to scan.
 *
 * Same links, on four tinted shelves. Nothing was removed.
 */
export default async function ProfilePage() {
  const [profile, entries, goals, vitalityHistory] = await Promise.all([
    getSessionProfile(),
    getMyEntries(),
    getMyGoals(),
    getVitalityHistory(),
  ])
  if (!profile) return null

  const shared = entries.filter((e) => e.visibility === 'circle').length
  const baseline = vitalityHistory.find((v) => v.label === 'baseline') ?? vitalityHistory[0] ?? null
  const latest = vitalityHistory[vitalityHistory.length - 1] ?? null

  return (
    <div className="flex flex-col gap-6">
      <div className="honey-glow flex flex-col items-center gap-3 rounded-3xl bg-card p-6 text-center ring-1 ring-border">
        <BloomAvatar name={profile.name} color={profile.avatar_color} avatarUrl={profile.avatar_url} className="h-16 w-16 text-xl" />
        <div className="flex flex-col items-center gap-1.5">
          <h1 className="font-serif text-2xl font-semibold">{profile.name}</h1>
          <TierBadge tier={profile.membership_tier} />
          <p className="text-xs text-muted-foreground">joined {relativeTime(profile.created_at)}</p>
        </div>
        {profile.streak_count > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
            <Flame className="h-3.5 w-3.5 text-honey" />
            {profile.streak_count} day{profile.streak_count === 1 ? '' : 's'} running
          </div>
        )}
      </div>

      {profile.membership_tier === 'free' && (
        <div className="rounded-3xl border border-dashed border-border bg-card p-5 text-center">
          <p className="font-serif text-lg font-semibold">unlock The Circle</p>
          <p className="mt-1 text-sm text-muted-foreground text-pretty">
            both programs, Watch, recipes and meal plans, every workout, Freedom, and posting in the Circle.
          </p>
          <Link
            href="/app/membership"
            className="mt-3 inline-block rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background"
          >
            see membership options
          </Link>
        </div>
      )}

      <HoneyProfileCard profile={profile} goals={goals.map((g) => g.goal)} baseline={baseline} latest={latest} />

      <ClosetShelf
        title="yours"
        tone="identity"
        items={[
          { href: '/app/becoming', label: 'Becoming', icon: Sparkles, note: "what's changed" },
          { href: '/app/write', label: 'Write', icon: PenLine },
          FEATURES.progress && { href: '/app/progress', label: 'Evolution', icon: TrendingUp },
          FEATURES.fixedCalendar && { href: '/app/calendar', label: 'Calendar', icon: CalendarDays },
          FEATURES.archive && { href: '/app/archive', label: 'Archive', icon: Archive },
          FEATURES.challenges && { href: '/app/challenges', label: 'Challenges', icon: Trophy },
        ]}
      />

      <ClosetShelf
        title="your body"
        tone="mindset"
        items={[
          FEATURES.protocols && { href: '/app/protocols', label: 'Protocols', icon: ClipboardList, note: 'skin, hair, nails' },
          { href: '/app/nutrition/goals', label: 'Targets', icon: Target, note: '& your cycle' },
          { href: '/app/workouts', label: 'Workouts', icon: Dumbbell },
          FEATURES.recipes && { href: '/app/recipes', label: 'Recipes', icon: ChefHat },
          FEATURES.pantry && { href: '/app/pantry', label: 'Pantry', icon: Refrigerator, note: '& grocery' },
        ]}
      />

      <ClosetShelf
        title="your people"
        tone="honey"
        items={[
          { href: '/app/household', label: 'Household', icon: Users },
          { href: '/app/learning', label: 'Learning', icon: GraduationCap, note: 'lists for home' },
          FEATURES.groups && { href: '/app/groups', label: 'Groups', icon: Users },
          FEATURES.expertQA && { href: '/app/ask', label: 'Ask an expert', icon: HelpCircle },
          { href: '/app/guidelines', label: 'Guidelines', icon: Heart },
        ]}
      />

      <ClosetShelf
        title="more from wild honey"
        tone="faith"
        items={[
          { href: SQUARE_LINKS.call ?? '/app/membership', label: 'A 1:1 with Brooke', icon: PhoneCall, note: '90 min · $198', external: Boolean(SQUARE_LINKS.call) },
          FEATURES.vault && { href: '/app/vault', label: 'Resource vault', icon: BookMarked },
          FEATURES.retreats && { href: '/app/retreats', label: 'Retreats', icon: Tent },
          FEATURES.shop && { href: '/app/shop', label: 'Shop', icon: ShoppingBag },
        ]}
      />

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-serif text-[17px] font-semibold">your reflections</h2>
          {entries.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {entries.length} total · {shared} shared
            </span>
          )}
        </div>
        {entries.length === 0 ? (
          <p className="rounded-3xl bg-card p-6 text-center text-sm text-muted-foreground ring-1 ring-border">
            nothing written yet — head to today&rsquo;s prompt to begin.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {entries.slice(0, 3).map((e) => (
              <div key={e.id} className="rounded-3xl bg-card p-4 ring-1 ring-border">
                <p className="text-xs text-muted-foreground">{relativeTime(e.created_at)}</p>
                {e.prompt && <p className="mt-1 text-xs italic text-muted-foreground text-pretty">&ldquo;{e.prompt.text}&rdquo;</p>}
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-pretty">{e.text}</p>
              </div>
            ))}
            {entries.length > 3 && (
              <Link href="/app/write" className="rounded-3xl bg-card p-4 text-center text-sm font-medium ring-1 ring-border">
                all {entries.length} reflections
              </Link>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Link
          href="/app/settings"
          className="flex items-center gap-3 rounded-3xl bg-card px-4 py-3.5 text-sm font-medium ring-1 ring-border"
        >
          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          Privacy &amp; notifications
        </Link>
        {profile.membership_tier !== 'free' && (
          <Link
            href="/app/membership"
            className="flex items-center gap-3 rounded-3xl bg-card px-4 py-3.5 text-sm font-medium ring-1 ring-border"
          >
            <Flame className="h-4 w-4 text-muted-foreground" />
            Your membership
          </Link>
        )}
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-secondary px-5 py-3 text-sm font-medium text-secondary-foreground"
          >
            <LogOut className="h-4 w-4" />
            sign out
          </button>
        </form>
      </div>
    </div>
  )
}
