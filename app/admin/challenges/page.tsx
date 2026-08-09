import { ChallengesAdminList } from '@/components/admin/challenges-admin-list'
import { getAllChallengesForAdmin } from '@/lib/data'

export default async function AdminChallengesPage() {
  const challenges = await getAllChallengesForAdmin()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Challenges</h1>
        <p className="mt-1 text-sm text-muted-foreground">only active challenges show up for members — toggle to open or close one.</p>
      </div>
      <ChallengesAdminList challenges={challenges} />
    </div>
  )
}
