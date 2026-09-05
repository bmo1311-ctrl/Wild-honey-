import { Check } from 'lucide-react'
import { MoneyAccounts } from '@/components/money-accounts'
import { MoneyQuickAdd } from '@/components/money-quick-add'
import { getMoney } from '@/lib/data'
import { debtFreeDate, fmtMoney, freedomPath, monthSummary, netWorth, runwayMonths } from '@/lib/money'
import { cn } from '@/lib/utils'

/**
 * The Freedom pillar. Her numbers, honest arithmetic on them, and the order
 * of moves that keeps her safe. It tracks and teaches general principles; it
 * does not tell her what to invest in.
 */
export default async function MoneyPage() {
  const { accounts, entries, goals } = await getMoney()
  const nw = netWorth(accounts)
  const month = monthSummary(entries)
  const runway = runwayMonths(accounts, entries)
  const debt = debtFreeDate(accounts)
  const path = freedomPath(accounts, entries, goals)
  const started = accounts.length > 0 || entries.length > 0
  const recent = entries.slice(0, 6)

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-serif text-[29px] font-semibold leading-[1.1]">Freedom</h1>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">know your numbers, then move them. nobody else ever sees this.</p>
      </div>

      {started && (
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-2xl border border-border bg-card px-3 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Net worth</p>
            <p className={cn('mt-1 font-serif text-[22px] font-semibold leading-none', nw.net < 0 && 'text-primary')}>{fmtMoney(nw.net)}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{fmtMoney(nw.assets)} · owe {fmtMoney(nw.debts)}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card px-3 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">This month</p>
            <p className={cn('mt-1 font-serif text-[22px] font-semibold leading-none', month.left < 0 && 'text-primary')}>{fmtMoney(month.left)}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">in {fmtMoney(month.income)} · out {fmtMoney(month.expenses)}{month.savingsRate != null ? ` · saved ${month.savingsRate}%` : ''}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card px-3 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Runway</p>
            <p className="mt-1 font-serif text-[22px] font-semibold leading-none">{runway == null ? '—' : `${runway} mo`}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{runway == null ? 'log a month of spending' : 'of expenses in cash and savings'}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card px-3 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Debt free</p>
            <p className="mt-1 font-serif text-[22px] font-semibold leading-none">{debt.months === 0 ? 'now' : debt.date ? debt.date.toLocaleDateString([], { month: 'short', year: 'numeric' }) : '—'}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{debt.months === 0 ? 'no debt on the books' : debt.date ? `${debt.months} months at ${fmtMoney(debt.totalMonthly)}/mo` : 'add a payment to each debt'}</p>
          </div>
        </div>
      )}

      <MoneyQuickAdd />

      <section>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">The path</h2>
        <ul className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
          {path.map((s, i) => (
            <li key={s.key} className={cn('flex items-start gap-3 px-4 py-3', i > 0 && 'border-t border-border', s.current && 'bg-mindset-pillar/8')}>
              <span className={cn('mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold', s.done ? 'bg-mindset-pillar text-white' : s.current ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                {s.done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
              </span>
              <span className="min-w-0">
                <span className={cn('block text-[15px] font-semibold', s.done && 'text-muted-foreground line-through')}>{s.title}</span>
                <span className="block text-[12.5px] leading-[1.4] text-pretty text-muted-foreground">{s.blurb}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[12px] leading-[1.45] text-pretty text-muted-foreground">General principles in a safe order, marked off from your own numbers. Not advice on any specific product or investment — for that, a licensed adviser.</p>
      </section>

      <section>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">Accounts</h2>
        <MoneyAccounts accounts={accounts} />
      </section>

      {recent.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">Recent</h2>
          <ul className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
            {recent.map((e, i) => (
              <li key={e.id} className={cn('flex items-center gap-3 px-4 py-2.5 text-[14px]', i > 0 && 'border-t border-border')}>
                <span className="w-12 shrink-0 text-[12px] text-muted-foreground">{e.date.slice(5)}</span>
                <span className="min-w-0 flex-1 truncate">{e.category ?? e.kind.replace('_', ' ')}</span>
                <span className={cn('shrink-0 font-semibold', e.kind === 'expense' ? 'text-primary' : e.kind === 'income' ? 'text-mindset-pillar' : '')}>{e.kind === 'expense' ? '−' : e.kind === 'income' ? '+' : ''}{fmtMoney(Number(e.amount))}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
