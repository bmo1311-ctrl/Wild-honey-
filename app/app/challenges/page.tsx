import { ChallengeCard } from '@/components/challenge-card'
import { ActiveChallengeTracker } from '@/components/active-challenge-tracker'
import { getChallenges } from '@/lib/data'

export default async function ChallengesPage() {
  const challenges = await getChallenges()
  const active = challenges.find((c) => c.joined)
  const others = challenges.filter((c) => !c.joined)

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Challenges</h1>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">structured, shared goals — do it alongside the rest of the circle.</p>
      </div>

      {active && <ActiveChallengeTracker challenge={active} />}

      <div>
        <h2 className="mb-3 font-serif text-lg font-semibold">{active ? 'other challenges' : 'available challenges'}</h2>
        {others.length === 0 ? (
          <p className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground ring-1 ring-border">nothing open right now — check back soon.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {others.map((c) => (
              <ChallengeCard key={c.id} challenge={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
