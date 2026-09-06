import { LearningScreen } from '@/components/learning-screen'
import { getHouseholdMembers, getLearningItems, getOwnerScope } from '@/lib/data'

/**
 * Homeschool at home: what each person is working through, ticked off day by
 * day. She switches between herself and each child.
 */
export default async function LearningPage({ searchParams }: { searchParams: Promise<{ member?: string }> }) {
  const { member } = await searchParams
  const scope = await getOwnerScope()
  const members = scope?.childMemberId ? [] : await getHouseholdMembers()
  const activeId = scope?.childMemberId ?? (member && members.some((m) => m.id === member) ? member : (members[0]?.id ?? null))
  const items = await getLearningItems(activeId)

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-serif text-[29px] font-semibold leading-[1.1]">Learning</h1>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">what everyone at home is working through.</p>
      </div>
      <LearningScreen members={members} initialMemberId={activeId} items={items} />
    </div>
  )
}
