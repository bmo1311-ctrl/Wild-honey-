import { KidEarn } from '@/components/kid-earn'
import { getKidRewards, getOwnerScope } from '@/lib/data'

/** Her first ledger. What she can earn, what is waiting, what is hers. */
export default async function KidMoneyPage() {
  const scope = await getOwnerScope()
  if (!scope?.childMemberId) return null
  const { rewards, earnings, balance } = await getKidRewards(scope.childMemberId)
  return (
    <div className="flex flex-col gap-5">
      <header className="honey-glow -mx-5 -mt-6 px-5 pb-5 pt-8">
        <h1 className="font-serif text-[32px] font-semibold leading-[1.1]">Earn</h1>
        <p className="mt-1.5 text-[17px] text-muted-foreground">Do the thing, tap the button, and it&rsquo;s yours once a grown-up says yes.</p>
      </header>
      <KidEarn rewards={rewards} earnings={earnings} balance={balance} />
    </div>
  )
}
