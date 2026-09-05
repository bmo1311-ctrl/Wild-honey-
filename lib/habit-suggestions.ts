/** Three concrete, small habits per goal she picked. Tap to add. */
const BY_GOAL: Record<string, string[]> = {
  more_energy: ['10 minutes outside before noon', 'Water before coffee', 'In bed by 10:30'],
  better_sleep: ['Screens off 30 min before bed', 'Same bedtime tonight', 'No caffeine after 2pm'],
  stress_reduction: ['Two minutes of slow breathing', 'One thing off the list', 'A walk without your phone'],
  strength: ['The four shapes', '20 squats', 'Carry something heavy on purpose'],
  nourishment: ['Protein at breakfast', 'A vegetable at lunch', 'Log dinner'],
  womens_health_education: ['Read one page', 'Note your cycle phase', 'Watch one video'],
  confidence: ['Say one true thing out loud', 'Stand up straight for a minute', 'Do the hard thing first'],
  spiritual_growth: ['Read the verse', 'Two minutes of quiet', 'One line of thanks'],
  emotional_wellness: ['Name the feeling', 'Text one person', 'Write three lines'],
  better_routines: ['Same wake time', 'Make the bed', 'Set tomorrow’s alarm'],
  community: ['Post one thing in the circle', 'Reply to someone', 'Ask for help once'],
  joy: ['Music while you cook', 'Ten minutes of something pointless', 'Call someone who makes you laugh'],
}

export function suggestHabits(goals: string[], existing: string[], limit = 4): string[] {
  const have = new Set(existing.map((s) => s.toLowerCase()))
  const pool = (goals.length ? goals : ['better_routines', 'nourishment']).flatMap((g) => BY_GOAL[g] ?? [])
  return [...new Set(pool)].filter((s) => !have.has(s.toLowerCase())).slice(0, limit)
}
