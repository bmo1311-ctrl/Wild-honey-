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

/**
 * Assets, debts, and the difference.
 *
 * A debt's balance is stored as a positive number — "I owe 5,000" is 5000, not
 * −5000. Nothing in the form said so, and the field is a bare "Balance", so
 * typing −5000 was the natural reading of owing money. That put net worth
 * *up* by 5,000, dropped the debt out of the payoff date entirely (it filters
 * on `balance > 0`), and rendered the row as `−-$5,000`.
 *
 * Taking the absolute value here is the honest fix: the sign carries no
 * information that `kind` does not already carry, so there is nothing to lose
 * by ignoring it, and a wrong sign is silent in every other direction.
 */
export function netWorth(accounts: MoneyAccount[]) {
  const live = accounts.filter((a) => !a.archived)
  const assets = live.filter((a) => a.kind !== 'debt').reduce((s, a) => s + Number(a.balance), 0)
  const debts = live.filter((a) => a.kind === 'debt').reduce((s, a) => s + Math.abs(Number(a.balance)), 0)
  return { assets, debts, net: assets - debts }
}

/**
 * This month's money.
 *
 * `month` must be passed by anything that cares about correctness. The default
 * is the *server's* month — UTC on Vercel — while every entry is dated with
 * `localToday()`. From late afternoon on the last day of the month in US
 * timezones the two disagree, and the card reads an empty month while the
 * entry she just logged sits in the old one.
 */
export function monthSummary(entries: MoneyEntry[], month = new Date().toISOString().slice(0, 7)) {
  const inMonth = entries.filter((e) => e.date.startsWith(month))
  const sum = (k: MoneyEntry['kind']) => inMonth.filter((e) => e.kind === k).reduce((s, e) => s + Number(e.amount), 0)
  const income = sum('income')
  const expenses = sum('expense')
  const saved = sum('saving') + sum('debt_payment')
  const savingsRate = income > 0 ? Math.round((saved / income) * 100) : null
  return { income, expenses, saved, savingsRate, left: income - expenses - saved }
}

/**
 * Months she could cover her usual expenses from cash and savings.
 *
 * The current month is excluded, and that is the whole fix. It used to count
 * as a full month in the divisor however many days had actually elapsed, so
 * on the 2nd — with one complete month logged behind it — average monthly
 * spend came out roughly halved and the runway roughly doubled. A number
 * labelled "of expenses in cash and savings" that doubles on the 2nd and
 * drifts back down all month is worse than no number.
 *
 * `today` is hers, passed in. Falling back to the server's month here would
 * reintroduce the same drift `monthSummary` above describes.
 */
export function runwayMonths(
  accounts: MoneyAccount[],
  entries: MoneyEntry[],
  today?: string,
): number | null {
  const liquid = accounts
    .filter((a) => !a.archived && (a.kind === 'cash' || a.kind === 'savings'))
    .reduce((s, a) => s + Number(a.balance), 0)

  const thisMonth = (today ?? new Date().toISOString().slice(0, 10)).slice(0, 7)
  const past = entries.filter((e) => e.kind === 'expense' && e.date.slice(0, 7) < thisMonth)

  // Nothing but the part-month she is standing in — not enough to average.
  const months = new Set(past.map((e) => e.date.slice(0, 7)))
  if (months.size === 0) return null

  const monthly = past.reduce((s, e) => s + Number(e.amount), 0) / months.size
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

/**
 * When the debts are gone, if she keeps paying what she pays now.
 *
 * The old version took the *longest* single debt at its own minimum and
 * paired that number with the *sum* of all the minimums — two different
 * plans, printed as one sentence: "N months at £X/mo". Paying £X every month
 * clears everything sooner than N, because each debt that finishes frees its
 * payment up for the next one. The page overstated the date and understated
 * her.
 *
 * So this simulates the plan the sentence actually describes: every debt gets
 * its minimum, and when one clears, that money rolls onto whichever debt
 * costs the most to carry. Month by month rather than closed-form, because
 * rolling payments has no tidy formula and 600 iterations is nothing.
 *
 * `stalled` is the case that was being mislabelled: a payment that exists but
 * does not cover the interest. The page showed the same "add a payment to
 * each debt" line it uses when no payment is set at all — telling her to do
 * the thing she had already done, instead of the one fact that mattered.
 */
export function debtFreeDate(accounts: MoneyAccount[]): {
  months: number | null
  date: Date | null
  totalMonthly: number
  /** Debts whose payment does not cover their own monthly interest. */
  stalled: string[]
} {
  // Same absolute-value reading as `netWorth`: a debt typed in as negative is
  // still a debt, and used to vanish from this calculation entirely.
  const debts = accounts
    .filter((a) => !a.archived && a.kind === 'debt' && Math.abs(Number(a.balance)) > 0)
    .map((a) => ({ ...a, balance: Math.abs(Number(a.balance)) }))
  if (debts.length === 0) return { months: 0, date: null, totalMonthly: 0, stalled: [] }

  const totalMonthly = debts.reduce((s, d) => s + Number(d.min_payment ?? 0), 0)

  const stalled = debts
    .filter((d) => {
      const monthly = Number(d.min_payment ?? 0)
      const r = (d.apr ?? 0) / 100 / 12
      return monthly <= 0 || monthly <= Number(d.balance) * r
    })
    .map((d) => d.name)

  if (totalMonthly <= 0) return { months: null, date: null, totalMonthly, stalled }

  // Balance and rate only; names are not needed for the arithmetic.
  let live = debts.map((d) => ({ balance: Number(d.balance), r: (d.apr ?? 0) / 100 / 12 }))
  const MAX_MONTHS = 600

  let months = 0
  while (live.length > 0 && months < MAX_MONTHS) {
    months++
    const before = live.reduce((s, d) => s + d.balance, 0)

    // Interest first, then the whole budget against the costliest debt.
    for (const d of live) d.balance += d.balance * d.r
    let budget = totalMonthly
    for (const d of [...live].sort((a, b) => b.r - a.r)) {
      if (budget <= 0) break
      const paid = Math.min(budget, d.balance)
      d.balance -= paid
      budget -= paid
    }
    live = live.filter((d) => d.balance > 0.005)

    // Not moving, and never will at this payment.
    const after = live.reduce((s, d) => s + d.balance, 0)
    if (live.length > 0 && after >= before) return { months: null, date: null, totalMonthly, stalled }
  }

  if (live.length > 0) return { months: null, date: null, totalMonthly, stalled }

  const date = new Date()
  // Set the day first: `setMonth` on the 31st overflows into the month after.
  date.setDate(1)
  date.setMonth(date.getMonth() + months)
  return { months, date, totalMonthly, stalled }
}

/**
 * The order that keeps her safe. Each step is a general principle, marked
 * done from her own numbers. Nothing here recommends a product.
 */
export function freedomPath(
  accounts: MoneyAccount[],
  entries: MoneyEntry[],
  goals: MoneyGoal[],
  today?: string,
) {
  const nw = netWorth(accounts)
  // Threaded through so the steps are judged against her month, not the
  // server's — "a real emergency fund" ticking green on a two-day-old month
  // was the same partial-month bug wearing a different hat.
  const month = monthSummary(entries, (today ?? new Date().toISOString().slice(0, 10)).slice(0, 7))
  const runway = runwayMonths(accounts, entries, today)
  const owed = (a: MoneyAccount) => Math.abs(Number(a.balance))
  const hasDebt = accounts.some((a) => !a.archived && a.kind === 'debt' && owed(a) > 0)
  const highInterest = accounts.some((a) => !a.archived && a.kind === 'debt' && owed(a) > 0 && (a.apr ?? 0) >= 10)
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
