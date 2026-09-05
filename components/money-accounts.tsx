'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, X } from 'lucide-react'
import { archiveMoneyAccount, upsertMoneyAccount } from '@/app/actions'
import { fmtMoney, type MoneyAccount } from '@/lib/money'
import { cn } from '@/lib/utils'

const KINDS = [
  { key: 'cash', label: 'Cash / checking' },
  { key: 'savings', label: 'Savings' },
  { key: 'investment', label: 'Investments' },
  { key: 'debt', label: 'Debt' },
] as const

/** Every account, with its balance. Debt shows its rate and payment so the payoff date is honest. */
export function MoneyAccounts({ accounts }: { accounts: MoneyAccount[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [f, setF] = useState({ id: '', name: '', kind: 'cash', balance: '', apr: '', min: '' })
  const [pending, startTransition] = useTransition()
  const field = 'h-11 w-full rounded-xl bg-background px-3 text-base outline-none ring-1 ring-border focus-visible:ring-2 focus-visible:ring-primary/40'

  function save() {
    startTransition(async () => {
      const res = await upsertMoneyAccount({ id: f.id || undefined, name: f.name, kind: f.kind, balance: Number(f.balance) || 0, apr: f.apr ? Number(f.apr) : null, minPayment: f.min ? Number(f.min) : null })
      if ('error' in res && res.error) {
        toast.error(res.error)
        return
      }
      setOpen(false)
      setF({ id: '', name: '', kind: 'cash', balance: '', apr: '', min: '' })
      router.refresh()
    })
  }

  const live = accounts.filter((a) => !a.archived)

  return (
    <div className="flex flex-col gap-2">
      {live.length > 0 && (
        <ul className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
          {live.map((a, i) => (
            <li key={a.id} className={cn('flex items-center gap-3 px-4 py-3', i > 0 && 'border-t border-border')}>
              <button type="button" onClick={() => { setF({ id: a.id, name: a.name, kind: a.kind, balance: String(a.balance), apr: a.apr == null ? '' : String(a.apr), min: a.min_payment == null ? '' : String(a.min_payment) }); setOpen(true) }} className="min-w-0 flex-1 text-left">
                <span className="block truncate text-[15px] font-medium">{a.name}</span>
                <span className="block text-[12px] text-muted-foreground">{KINDS.find((k) => k.key === a.kind)?.label}{a.kind === 'debt' && a.apr != null ? ` · ${a.apr}%` : ''}</span>
              </button>
              <span className={cn('shrink-0 text-[15px] font-semibold', a.kind === 'debt' ? 'text-primary' : '')}>{a.kind === 'debt' ? '−' : ''}{fmtMoney(Number(a.balance))}</span>
              <button type="button" onClick={() => startTransition(async () => { await archiveMoneyAccount(a.id); router.refresh() })} aria-label={`Remove ${a.name}`} className="shrink-0 p-1 text-muted-foreground"><X className="h-4 w-4" /></button>
            </li>
          ))}
        </ul>
      )}
      {open ? (
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex flex-col gap-2">
            <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Name (e.g. Chase checking)" className={field} autoFocus />
            <div className="grid grid-cols-2 gap-1.5">
              {KINDS.map((k) => (
                <button key={k.key} type="button" onClick={() => setF({ ...f, kind: k.key })} className={cn('h-10 rounded-xl text-[13px] font-medium', f.kind === k.key ? 'bg-mindset-pillar text-white' : 'bg-muted text-muted-foreground')}>{k.label}</button>
              ))}
            </div>
            <input value={f.balance} onChange={(e) => setF({ ...f, balance: e.target.value })} inputMode="decimal" placeholder="Balance" className={field} />
            {f.kind === 'debt' && (
              <div className="grid grid-cols-2 gap-2">
                <input value={f.apr} onChange={(e) => setF({ ...f, apr: e.target.value })} inputMode="decimal" placeholder="Interest rate %" className={field} />
                <input value={f.min} onChange={(e) => setF({ ...f, min: e.target.value })} inputMode="decimal" placeholder="Monthly payment" className={field} />
              </div>
            )}
            <div className="flex gap-2">
              <button type="button" onClick={save} disabled={pending} className="h-11 flex-1 rounded-xl bg-primary text-sm font-bold text-primary-foreground disabled:opacity-50">Save</button>
              <button type="button" onClick={() => setOpen(false)} className="h-11 rounded-xl bg-muted px-4 text-sm font-medium">Cancel</button>
            </div>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="flex h-[48px] items-center justify-center gap-2 rounded-2xl border border-border bg-card text-[15px] font-semibold"><Plus className="h-4 w-4" /> Add an account</button>
      )}
    </div>
  )
}
