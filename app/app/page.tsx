import { Flame, Lock } from 'lucide-react'
import Link from 'next/link'
import { JournalComposer } from '@/components/journal-composer'
import { TodayFocusCard } from '@/components/today-focus-card'
import { ResetPanel } from '@/components/reset-panel'
import { MorningResetCard } from '@/components/morning-reset-card'
import { EveningReflectionCard } from '@/components/evening-reflection-card'
import { ActiveChallengeTracker } from '@/components/active-challenge-tracker'
import {
  computeTodayFocus,
  getMyActiveChallenge,
  getMyEntryForPrompt,
  getMyGoals,
  getRecentCheckins,
  getSessionProfile,
  getTodayCheckin,
  getTodayEveningReflection,
  getTodayMorningReset,
  getTodayPrompt,
} from '@/lib/data'
import { PILLAR_META } from '@/lib/pillars'
import { SEASON_META } from '@/lib/honey-profile'

export default async function TodayPage() {
  const [profile, prompt, todayCheckin, recentCheckins, morningReset, eveningReflection, goals, activeChallenge] = await Promise.all([
    getSessionProfile(),
    getTodayPrompt(),
    getTodayCheckin(),
    getRecentCheckins(7),
    getTodayMorningReset(),
    getTodayEveningReflection(),
    getMyGoals(),
    getMyActiveChallenge(),
  ])
  const existing = prompt ? await getMyEntryForPrompt(prompt.id) : null
  const focus = computeTodayFocus(todayCheckin, recentCheckins, {
    hydrationGoalOz: profile?.hydration_goal_oz,
    goals: goals.map((g) => g.goal),
    faithPreference: profile?.faith_preference,
    season: profile?.season,
  })

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const locked = prompt?.is_premium && profile?.membership_tier === 'free'
  const seasonLabel = profile?.season ? SEASON_META[profile.season].label : null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{today}</p>
          <h1 className="font-serif text-3xl font-semibold text-balance">
            Good morning, {profile?.name}
          </h1>
          {seasonLabel && <p className="mt-0.5 text-xs text-muted-foreground">a season of {seasonLabel}</p>}
        </div>
        <div className="flex flex-col items-center rounded-2xl bg-card px-4 py-3 ring-1 ring-border">
          <span className="flex items-center gap-1 font-serif text-2xl font-semibold text-honey">
            <Flame className="h-5 w-5" />
            {profile?.streak_count ?? 0}
          </span>
          <span className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">
            day streak
          </span>
        </div>
      </div>

      <ResetPanel />
      <TodayFocusCard focus={focus} />
      {activeChallenge && <ActiveChallengeTracker challenge={activeChallenge} compact />}
      <MorningResetCard existing={morningReset} />
      <EveningReflectionCard existing={eveningReflection} />

      <div className="border-t border-border pt-6">
        <p className="mb-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">today's writing prompt</p>
      </div>

      {!prompt && (
        <div className="rounded-2xl bg-card p-6 text-center ring-1 ring-border">
          <p className="text-muted-foreground">No prompt today. Check back soon.</p>
        </div>
      )}

      {prompt && (
        <>
          <section className="rounded-2xl bg-secondary/60 p-6 ring-1 ring-border">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${PILLAR_META[prompt.pillar].chip}`}
            >
              <span className={`h-2 w-2 rounded-full ${PILLAR_META[prompt.pillar].dot}`} />
              {prompt.pillar}
            </span>
            <h2 className="mt-4 font-serif text-2xl font-medium leading-snug text-pretty">
              {prompt.text}
            </h2>
          </section>

          {locked ? (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-card p-8 text-center">
              <span className="hex-clip flex h-12 w-12 items-center justify-center bg-honey text-honey-foreground">
                <Lock className="h-5 w-5" />
              </span>
              <div>
                <p className="font-serif text-lg font-semibold">A premium Faith prompt</p>
                <p className="mt-1 text-sm text-muted-foreground text-pretty">
                  Join The Circle to unlock premium prompts and share with the community.
                </p>
              </div>
              <Link
                href="/app/profile"
                className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background"
              >
                Upgrade membership
              </Link>
            </div>
          ) : (
            <JournalComposer promptId={prompt.id} existing={existing} />
          )}
        </>
      )}
    </div>
  )
}
