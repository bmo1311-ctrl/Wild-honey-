import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { BloomAvatar } from '@/components/bloom-avatar'
import { RecipeCard } from '@/components/recipe-card'
import { getMemberProgressCount, getMemberSharedRecipes, getMemberWins, getPublicProfile, getSessionProfile } from '@/lib/data'

/** What a member chose to show. Everything here is opt-in; the default is name and photo. */
export default async function MemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const me = await getSessionProfile()
  if (me?.id === id) redirect('/app/profile')
  const member = await getPublicProfile(id)
  if (!member) notFound()

  const show = member.profile_show ?? {}
  const [recipes, days, wins] = await Promise.all([
    show.recipes ? getMemberSharedRecipes(id) : Promise.resolve([]),
    show.progress ? getMemberProgressCount(id) : Promise.resolve(0),
    show.wins ? getMemberWins(id) : Promise.resolve([]),
  ])

  return (
    <div className="flex flex-col gap-6">
      <Link href="/app/circle" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ChevronLeft className="h-4 w-4" /> Circle
      </Link>

      <div className="flex items-center gap-4">
        <BloomAvatar name={member.name} color={member.avatar_color} avatarUrl={member.avatar_url} className="h-16 w-16 text-xl" />
        <div className="min-w-0">
          <h1 className="font-serif text-[26px] font-semibold leading-tight">{member.name}</h1>
          {show.progress && days > 0 && <p className="text-sm text-muted-foreground">{days} course {days === 1 ? 'day' : 'days'} done</p>}
        </div>
      </div>

      {member.bio && <p className="text-[16px] leading-[1.5] text-pretty">{member.bio}</p>}

      {show.wins && wins.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">Recent wins</h2>
          <ul className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
            {wins.map((w, i) => (
              <li key={w.id} className={i > 0 ? 'border-t border-border px-4 py-3 text-[15px]' : 'px-4 py-3 text-[15px]'}>{w.text}</li>
            ))}
          </ul>
        </section>
      )}

      {show.recipes && recipes.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">Recipes she shares</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {recipes.map((r) => (
              <RecipeCard key={r.id} recipe={r} />
            ))}
          </div>
        </section>
      )}

      {!member.bio && !(show.wins && wins.length) && !(show.recipes && recipes.length) && (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-[15px] text-muted-foreground">
          {member.name} hasn&rsquo;t added anything to her page yet.
        </p>
      )}
    </div>
  )
}
