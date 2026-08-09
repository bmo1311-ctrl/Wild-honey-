import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Please log in first.' }, { status: 401 })

  const tables = [
    'profiles',
    'journal_entries',
    'checkins',
    'morning_resets',
    'evening_reflections',
    'wins',
    'habits',
    'habit_logs',
    'user_goals',
    'vitality_checkins',
    'transformation_reflections',
    'community_posts',
    'group_posts',
    'retreat_signups',
    'purchases',
    'pantry_items',
    'grocery_builder_items',
    'expert_questions',
  ] as const

  const results = await Promise.all(
    tables.map(async (table) => {
      const { data } = await supabase.from(table).select('*').eq(table === 'profiles' ? 'id' : 'user_id', user.id)
      return [table, data ?? []] as const
    }),
  )

  const payload: Record<string, unknown> = { exported_at: new Date().toISOString(), user_id: user.id }
  for (const [table, data] of results) payload[table] = data

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="wild-honey-data-export.json"`,
    },
  })
}
