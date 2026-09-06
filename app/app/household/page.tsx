import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { HouseholdManager } from '@/components/household-manager'
import { getHouseholdMembers, getKidRewards } from '@/lib/data'

export default async function HouseholdPage() {
  const members = await getHouseholdMembers()
  const kids = members.filter((m) => !m.is_self)
  const rewards = Object.fromEntries(await Promise.all(kids.map(async (k) => [k.id, await getKidRewards(k.id)] as const)))

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link href="/app/profile" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ChevronLeft className="h-4 w-4" /> You
        </Link>
        <h1 className="font-serif text-[29px] font-semibold leading-[1.1]">Your household</h1>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">
          everyone you&rsquo;re tracking. add a child and you can keep their learning list and their food alongside your own.
        </p>
      </div>
      <HouseholdManager members={members} rewards={rewards} />
    </div>
  )
}
