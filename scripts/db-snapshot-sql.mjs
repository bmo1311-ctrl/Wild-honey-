#!/usr/bin/env node
/**
 * Print the query that regenerates supabase/schema-snapshot.txt.
 *
 * It prints rather than runs, on purpose. Refreshing the snapshot needs
 * database credentials, and those live in Vercel — not in this repo, not in a
 * .env file, and not in anything that could be committed by accident. So this
 * hands over the one piece that is safe to keep in version control (the query)
 * and leaves the credentials where they belong.
 *
 * Run it, paste the query into the Supabase SQL editor, and replace everything
 * below the header in supabase/schema-snapshot.txt with the result.
 */

const QUERY = `select t.table_name||'|'||string_agg(c.column_name, ',' order by c.ordinal_position) as line
from information_schema.columns c
join information_schema.tables t
  on t.table_schema = 'public' and t.table_name = c.table_name
where c.table_schema = 'public'
group by t.table_name
order by t.table_name;`

console.log(`
Refreshing the schema snapshot
─────────────────────────────
1. Open the SQL editor for the project.
2. Run this:

${QUERY}

3. Copy the 'line' column of every row.
4. Replace everything below the header comment in
   supabase/schema-snapshot.txt with those lines.
5. npm run check:columns

Do this after any migration that adds, renames or drops a column.
The snapshot is names only — no data, nothing secret.
`)
