/** Things a parent can add with one tap, with an amount that fits the age. */
export function rewardIdeas(age: number | null): { title: string; amount: number; cadence: 'daily' | 'weekly' | 'once' }[] {
  const a = age ?? 9
  const s = a <= 7 ? 0.5 : a <= 10 ? 1 : a <= 13 ? 2 : 3
  return [
    { title: 'Read for 20 minutes', amount: s, cadence: 'daily' },
    { title: 'Make your bed', amount: s / 2, cadence: 'daily' },
    { title: 'Finish every learning item', amount: s * 2, cadence: 'daily' },
    { title: 'Log what you ate all day', amount: s, cadence: 'daily' },
    { title: 'Unload the dishwasher', amount: s, cadence: 'daily' },
    { title: 'Ten minutes outside', amount: s / 2, cadence: 'daily' },
    { title: 'Tidy your room, properly', amount: s * 3, cadence: 'weekly' },
    { title: 'Help cook dinner', amount: s * 2, cadence: 'weekly' },
    { title: 'A week with no reminders', amount: s * 5, cadence: 'weekly' },
    { title: 'Finish a book', amount: s * 5, cadence: 'once' },
  ]
}
