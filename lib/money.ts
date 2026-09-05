/**
 * The Freedom pillar. Arithmetic on what she recorded — net worth, cash flow,
 * runway, a debt-free date — and a path of general principles in the order
 * that makes them safe. It teaches and it tracks. It never tells her what to
 * buy or where to invest; that stays with a licensed adviser.
 */

export interface MoneyAccount {
  id: string
  name: string
  kind: 'cash' | 'savings' | 'investment' | 'debt'
  balance: number
  apr: number | null
  min_payment: number | null
  archived: boolean
}
export interface MoneyEntry {
  id: string
  date: string
  kind: 'income' | 'expense' | 'saving' | 'debt_payment'
  category: string | null
  amount: number
  note: string | null
}
export interface MoneyGoal {
  id: string
  kind: 'emergency_fund' | 'debt_free' | 'savings' | 'income'
  title: string
  target: number
  due_date: string | null
}

export function netWorth(accounts: MoneyAccount[]) {
  const live = accounts.filter((a) => !a.archived)
  const assets = live.filter((a) => a.kind !== 'debt').reduce((s, a) => s + Number(a.balance), 0)
  const debts = live.filter((a) => a.kind === 'debt').reduce((s, a) => s + Number(a.balance), 0)
  return { assets, debts, net: assets - debts }
}

export function monthSummary(entries: MoneyEntry[], month = new Date().toISOString().slice(0, 7)) {
  const inMonth = entries.filter((e) => e.date.startsWith(month))
  const sum = (k: MoneyEntry['kind']) => inMonth.filter((e) => e.kind === k).reduce((s, e) => s + Number(e.amount), 0)
  const income = sum('income')
  const expenses = sum('expense')
  const saved = sum('saving') + sum('debt_payment')
  const savingsRate = income > 0 ? Math.round((saved / income) * 100) : null
  return { income, expenses, saved, savingsRate, left: income - expenses - saved }
}

/** Months she could cover her usual expenses from cash and savings. */
export function runwayMonths(accounts: MoneyAccount[], entries: MoneyEntry[]): number | null {
  const liquid = accounts.filter((a) => !a.archived && (a.kind === 'cash' || a.kind === 'savings')).reduce((s, a) => s + Number(a.balance), 0)
  const months = new Set(entries.filter((e) => e.kind === 'expense').map((e) => e.date.slice(0, 7)))
  if (months.size === 0) return null
  const monthly = entries.filter((e) => e.kind === 'expense').reduce((s, e) => s + Number(e.amount), 0) / months.size
  return monthly > 0 ? Math.round((liquid / monthly) * 10) / 10 : null
}

/** Months to clear a debt at a fixed monthly payment, with interest. */
export function monthsToPayOff(balance: number, apr: number | null, monthly: number): number | null {
  if (balance <= 0) return 0
  if (monthly <= 0) return null
  const r = (apr ?? 0) / 100 / 12
  if (r === 0) return Math.ceil(balance / monthly)
  const interestOnly = balance * r
  if (monthly <= interestOnly) return null
  return Math.ceil(-Math.log(1 - (balance * r) / monthly) / Math.log(1 + r))
}

export function debtFreeDate(accounts: MoneyAccount[]): { months: number | null; date: Date | null; totalMonthly: number } {
  const debts = accounts.filter((a) => !a.archived && a.kind === 'debt' && Number(a.balance) > 0)
  if (debts.length === 0) return { months: 0, date: null, totalMonthly: 0 }
  const totalMonthly = debts.reduce((s, d) => s + Number(d.min_payment ?? 0), 0)
  const perDebt = debts.map((d) => monthsToPayOff(Number(d.balance), d.apr, Number(d.min_payment ?? 0)))
  if (perDebt.some((m) => m === null)) return { months: null, date: null, totalMonthly }
  const months = Math.max(...(perDebt as number[]))
  const date = new Date()
  date.setMonth(date.getMonth() + months)
  return { months, date, totalMonthly }
}

/**
 * The order that keeps her safe. Each step is a general principle, marked
 * done from her own numbers. Nothing here recommends a product.
 */
export function freedomPath(accounts: MoneyAccount[], entries: MoneyEntry[], goals: MoneyGoal[]) {
  const nw = netWorth(accounts)
  const month = monthSummary(entries)
  const runway = runwayMonths(accounts, entries)
  const hasDebt = accounts.some((a) => !a.archived && a.kind === 'debt' && Number(a.balance) > 0)
  const highInterest = accounts.some((a) => !a.archived && a.kind === 'debt' && Number(a.balance) > 0 && (a.apr ?? 0) >= 10)
  const investing = accounts.some((a) => !a.archived && a.kind === 'investment' && Number(a.balance) > 0)
  const entriesLast30 = entries.filter((e) => Date.parse(e.date) > Date.now() - 30 * 86_400_000).length

  return [
    { key: 'know', title: 'Know your numbers', blurb: 'every account listed, income and spending logged for a month', done: accounts.length > 0 && entriesLast30 >= 5 },
    { key: 'starter', title: 'A starter cushion', blurb: 'one month of expenses in cash or savings', done: runway !== null && runway >= 1 },
    { key: 'high', title: 'Kill high-interest debt', blurb: 'anything at 10% or more goes first', done: !highInterest },
    { key: 'fund', title: 'A real emergency fund', blurb: 'three to six months of expenses', done: runway !== null && runway >= 3 },
    { key: 'rate', title: 'Pay yourself first', blurb: 'save or repay 15% of what comes in, automatically', done: (month.savingsRate ?? 0) >= 15 },
    { key: 'free', title: 'Debt free', blurb: 'the last balance gone', done: !hasDebt && accounts.length > 0 },
    { key: 'grow', title: 'Make money work', blurb: 'long-term investing, on a plan you understand — a licensed adviser can help with what', done: investing },
  ].map((s, i, arr) => ({ ...s, current: !s.done && arr.slice(0, i).every((p) => p.done) }))
}

export function fmtMoney(n: number): string {
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}
