/**
 * The International Fixed Calendar (Cotsworth Plan, 1902) — 13 months of
 * exactly 28 days each. Sol sits between June and July. A Year Day at the
 * end of the year, and a Leap Day inserted after June in leap years,
 * belong to no month and no week.
 *
 * Reference structure (verified):
 *   Jan Feb Mar Apr May Jun [Leap Day, leap years only] Sol Jul Aug Sep Oct Nov Dec [Year Day]
 *   Common year: 364 + 1 Year Day = 365 days. Leap year: 364 + 1 Leap Day + 1 Year Day = 366.
 */

export const FIXED_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'Sol',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const

export type FixedDate =
  | { kind: 'month'; year: number; monthIndex: number; monthName: string; day: number }
  | { kind: 'leap_day'; year: number }
  | { kind: 'year_day'; year: number }

export function isGregorianLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

function dayOfYear(date: Date): number {
  const start = Date.UTC(date.getUTCFullYear(), 0, 1)
  const cur = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  return Math.floor((cur - start) / 86400000) + 1
}

/** Gregorian Date -> Fixed calendar date. */
export function gregorianToFixed(date: Date): FixedDate {
  const year = date.getUTCFullYear()
  const leap = isGregorianLeapYear(year)
  const doy = dayOfYear(date)

  // Jan-June: identical in every year, unaffected by the leap/Sol boundary.
  if (doy <= 168) {
    const monthIndex = Math.floor((doy - 1) / 28)
    const day = ((doy - 1) % 28) + 1
    return { kind: 'month', year, monthIndex, monthName: FIXED_MONTHS[monthIndex], day }
  }

  if (leap && doy === 169) return { kind: 'leap_day', year }
  if (!leap && doy === 365) return { kind: 'year_day', year }
  if (leap && doy === 366) return { kind: 'year_day', year }

  const base = leap ? 169 : 168 // last day-of-year before Sol's block begins
  const offset = doy - base // 1-196, covers Sol through December
  const monthIndex = 6 + Math.floor((offset - 1) / 28) // 6 = Sol
  const day = ((offset - 1) % 28) + 1
  return { kind: 'month', year, monthIndex, monthName: FIXED_MONTHS[monthIndex], day }
}

/** Fixed calendar month/day -> Gregorian Date. */
export function fixedToGregorian(year: number, monthIndex: number, day: number): Date {
  const leap = isGregorianLeapYear(year)
  let doy: number
  if (monthIndex <= 5) {
    doy = monthIndex * 28 + day
  } else {
    const base = leap ? 169 : 168
    doy = base + (monthIndex - 6) * 28 + day
  }
  const jan1 = Date.UTC(year, 0, 1)
  return new Date(jan1 + (doy - 1) * 86400000)
}

export function leapDayGregorian(year: number): Date | null {
  if (!isGregorianLeapYear(year)) return null
  const jan1 = Date.UTC(year, 0, 1)
  return new Date(jan1 + 168 * 86400000) // doy 169
}

export function yearDayGregorian(year: number): Date {
  const leap = isGregorianLeapYear(year)
  const jan1 = Date.UTC(year, 0, 1)
  return new Date(jan1 + ((leap ? 366 : 365) - 1) * 86400000)
}

/** ISO 'YYYY-MM-DD' for a UTC date, matching how dates are stored elsewhere in the app. */
export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10)
}
