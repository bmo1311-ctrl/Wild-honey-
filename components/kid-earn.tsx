'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check, Coins } from 'lucide-react'
import { claimKidReward } from '@/app/actions'
import type { KidEarning, KidReward } from '@/lib/data'
import { cn } from '@/lib/utils'

const money = (n: number) => `$${Number(n).toFixed(Number(n) % 1 ? 2 : 0)}`

export function KidEarn({ rewards, earnings, balance }: { rewards: KidReward[]; earnings: KidEarning[]; balance: { waiting: number; ready: number; paid: number } }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function claim(r: KidReward) {
    startTransition(async () => {
      const res = await claimKidReward(r.id)
      if ('error' in res && res.error) {
        toast.error(res.error)
        return
      }
      toast.success(`Nice! ${money(r.amount)} — waiting for a grown-up to say yes`)
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-3 gap-2">
        {[
          ['Waiting', balance.waiting, 'for a yes'],
          ['Ready', balance.ready, 'to be paid'],
          ['Paid', balance.paid, 'all yours'],
        ].map(([l, v, s]) => (
          <div key={l as string} className={cn('rounded-2xl px-2 py-3 text-center', l === 'Ready' ? 'bg-primary/20' : 'border border-border bg-card')}>
            <p className="font-serif text-[22px] font-semibold leading-none">{money(v as number)}</p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{l as string}</p>
            <p className="text-[10px] text-muted-foreground">{s as string}</p>
          </div>
        ))}
      </div>

      <section>
        <h2 className="mb-2 flex items-center gap-1.5 font-serif text-[20px] font-semibold"><Coins className="h-5 w-5 text-primary" /> Ways to earn</h2>
        {rewards.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-[15px] text-muted-foreground">Nothing set up yet — ask your grown-up.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {rewards.map((r) => (
              <li key={r.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block text-[16px] font-semibold">{r.title}</span>
                  <span className="block text-[12px] text-muted-foreground">{r.cadence === 'once' ? 'one time' : r.cadence === 'weekly' ? 'once a week' : 'every day'}{r.learning_item_id ? ' · counts when you tick it in Learning' : ''}</span>
                </span>
                <span className="shrink-0 font-serif text-[18px] font-semibold">{money(r.amount)}</span>
                {!r.learning_item_id && (
                  <button type="button" disabled={pending || r.claimed} onClick={() => claim(r)} className={cn('h-10 shrink-0 rounded-xl px-3 text-sm font-bold', r.claimed ? 'bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground')}>
                    {r.claimed ? <Check className="h-4 w-4" /> : 'I did it!'}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {earnings.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">Lately</h2>
          <ul className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
            {earnings.slice(0, 12).map((e, i) => (
              <li key={e.id} className={cn('flex items-center gap-3 px-4 py-2.5 text-[14px]', i > 0 && 'border-t border-border')}>
                <span className="w-12 shrink-0 text-[12px] text-muted-foreground">{e.date.slice(5)}</span>
                <span className="min-w-0 flex-1 truncate">{e.title}</span>
                <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase', e.status === 'paid' ? 'bg-primary/20' : e.status === 'approved' ? 'bg-mindset-pillar/15' : e.status === 'declined' ? 'bg-muted line-through' : 'bg-muted')}>{e.status}</span>
                <span className="shrink-0 font-semibold">{money(e.amount)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
