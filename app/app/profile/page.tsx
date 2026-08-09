import Link from 'next/link'
import { Flame, LogOut, ShoppingBag, Tent, Archive, ChevronRight, ClipboardList, Refrigerator, BookMarked, Users, HelpCircle, TrendingUp, ShieldCheck, Heart, ChefHat, Trophy, CalendarDays } from 'lucide-react'
import { signOut } from '@/app/actions'
import { ProfileEditor } from '@/components/profile-editor'
import { HoneyProfileCard } from '@/components/honey-profile-card'
import { BloomAvatar } from '@/components/bloom-avatar'
import { TierBadge } from '@/components/tier-badge'
import { getMyEntries, getMyGoals, getSessionProfile, getVitalityHistory } from '@/lib/data'
import { relativeTime } from '@/lib/pillars'

export default async function ProfilePage() {
  const [profile, entries, goals, vitalityHistory] = await Promise.all([getSessionProfile(), getMyEntries(), getMyGoals(), getVitalityHistory()])
  if (!profile) return null

  const shared = entries.filter((e) => e.visibility === 'circle').length
  const baseline = vitalityHistory.find((v) => v.label === 'baseline') ?? vitalityHistory[0] ?? null
  const latest = vitalityHistory[vitalityHistory.length - 1] ?? null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-card p-6 text-center ring-1 ring-border">
        <BloomAvatar name={profile.name} color={profile.avatar_color} avatarUrl={profile.avatar_url} className="h-16 w-16 text-xl" />
        <div className="flex flex-col items-center gap-1.5">
          <h1 className="font-serif text-2xl font-semibold">{profile.name}</h1>
          <TierBadge tier={profile.membership_tier} />
          <p className="text-xs text-muted-foreground">joined {relativeTime(profile.created_at)}</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
          <Flame className="h-3.5 w-3.5 text-honey" />
          {profile.streak_count} day streak
        </div>
      </div>

      {profile.membership_tier === 'free' && (
        <div className="rounded-2xl border border-dashed border-border bg-card p-5 text-center">
          <p className="font-serif text-lg font-semibold">unlock The Circle</p>
          <p className="mt-1 text-sm text-muted-foreground text-pretty">
            premium prompts, the full archive, and early access to retreats.
          </p>
          <Link
            href="/app/membership"
            className="mt-3 inline-block rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background"
          >
            see membership options
          </Link>
        </div>
      )}

      {profile.membership_tier !== 'free' && (
        <Link
          href="/api/billing-portal"
          className="rounded-2xl bg-card p-4 text-center text-sm font-medium ring-1 ring-border"
        >
          manage your membership
        </Link>
      )}

      <ProfileEditor name={profile.name} avatarColor={profile.avatar_color} avatarUrl={profile.avatar_url} />

      <HoneyProfileCard profile={profile} goals={goals.map((g) => g.goal)} baseline={baseline} latest={latest} />

      <div>
        <p className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">my journey</p>
        <div className="flex flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-border">
          <Link href="/app/progress" className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium">My Evolution</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Link href="/app/calendar" className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium">Calendar</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Link href="/app/challenges" className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
            <Trophy className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium">Challenges</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Link href="/app/archive" className="flex items-center gap-3 px-4 py-3.5">
            <Archive className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium">Archive</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </div>
      </div>

      <div>
        <p className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">nourish &amp; move</p>
        <div className="flex flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-border">
          <Link href="/app/recipes" className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
            <ChefHat className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium">Recipes</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Link href="/app/pantry" className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
            <Refrigerator className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium">Pantry &amp; Grocery</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Link href="/app/protocols" className="flex items-center gap-3 px-4 py-3.5">
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium">Protocols</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </div>
      </div>

      <div>
        <p className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">connect</p>
        <div className="flex flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-border">
          <Link href="/app/groups" className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium">Groups</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Link href="/app/vault" className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
            <BookMarked className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium">Resource Vault</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Link href="/app/ask" className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium">Ask an Expert</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Link href="/app/guidelines" className="flex items-center gap-3 px-4 py-3.5">
            <Heart className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium">Community Guidelines</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </div>
      </div>

      <div>
        <p className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">retreats &amp; shop</p>
        <div className="flex flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-border">
          <Link href="/app/retreats" className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
            <Tent className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium">Retreats</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Link href="/app/shop" className="flex items-center gap-3 px-4 py-3.5">
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium">Shop</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </div>
      </div>

      <div>
        <p className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">account</p>
        <div className="flex flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-border">
          <Link href="/app/settings" className="flex items-center gap-3 px-4 py-3.5">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium">Privacy &amp; Notifications</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-serif text-lg font-semibold">your reflections</h2>
          <span className="text-xs text-muted-foreground">
            {entries.length} total · {shared} shared
          </span>
        </div>
        {entries.length === 0 ? (
          <p className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground ring-1 ring-border">
            nothing written yet — head to today's prompt to begin.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {entries.map((e) => (
              <div key={e.id} className="rounded-2xl bg-card p-4 ring-1 ring-border">
                <p className="text-xs text-muted-foreground">{relativeTime(e.created_at)}</p>
                {e.prompt && (
                  <p className="mt-1 text-xs italic text-muted-foreground text-pretty">"{e.prompt.text}"</p>
                )}
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-pretty">{e.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>

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
  )
}
