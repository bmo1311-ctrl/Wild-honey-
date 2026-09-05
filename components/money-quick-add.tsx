'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { addMoneyEntry } from '@/app/actions'
import { cn } from '@/lib/utils'

const KINDS = [
  { key: 'expense', label: 'Spent' },
  { key: 'income', label: 'Came in' },
  { key: 'saving', label: 'Saved' },
  { key: 'debt_payment', label: 'Paid debt' },
] as const

/** One line: what happened and how much. */
export function MoneyQuickAdd() {
  const router = useRouter()
  const [kind, setKind] = useState<(typeof KINDS)[number]['key']>('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [pending, startTransition] = useTransition()

  function submit() {
    startTransition(async () => {
      const res = await addMoneyEntry({ kind, amount: Number(amount), category })
      if ('error' in res && res.error) {
        toast.error(res.error)
        return
      }
      toast.success('Logged')
      setAmount('')
      setCategory('')
      router.refresh()
    })
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-2 flex gap-1.5">
        {KINDS.map((k) => (
          <button key={k.key} type="button" onClick={() => setKind(k.key)} className={cn('h-10 flex-1 rounded-xl text-[13px] font-medium', kind === k.key ? 'bg-mindset-pillar text-white' : 'bg-muted text-muted-foreground')}>{k.label}</button>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={amount} onChange={(e) => setAmount(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} inputMode="decimal" placeholder="$" className="h-12 w-28 rounded-xl bg-background px-3 text-base outline-none ring-1 ring-border focus-visible:ring-2 focus-visible:ring-primary/40" />
        <input value={category} onChange={(e) => setCategory(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} placeholder={kind === 'income' ? 'from' : 'what for'} className="h-12 flex-1 rounded-xl bg-background px-3 text-base outline-none ring-1 ring-border focus-visible:ring-2 focus-visible:ring-primary/40" />
        <button type="button" onClick={submit} disabled={pending || !(Number(amount) > 0)} className="h-12 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground disabled:opacity-50">Log</button>
      </div>
    </div>
  )
}
