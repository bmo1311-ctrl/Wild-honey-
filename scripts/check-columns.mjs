#!/usr/bin/env node
/**
 * Catch a column name that does not exist, before it ships.
 *
 * The Supabase client in this app is untyped. That means `tsc --noEmit` — the
 * gate everything else passes through — has nothing to say about
 * `.select('completed_on')` when the column is called `completed_at`. It
 * compiles perfectly, the query returns an error object at runtime, the caller
 * does `?? []`, and the feature is simply empty for ever. That exact bug was
 * live in lib/personal-state-db.ts and was found by hand.
 *
 * So this walks every `.from('table')` chain in the codebase, collects the
 * column names used with it, and checks them against supabase/schema-snapshot.txt.
 *
 * Run:  npm run check:columns
 *
 * When it is wrong, it is wrong in the safe direction — it reports a column
 * that is fine, rather than missing one that is broken. Add a suppression
 * below with a note saying why, rather than loosening the parser.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'

const ROOT = process.cwd()
const SNAPSHOT = join(ROOT, 'supabase', 'schema-snapshot.txt')
const SKIP_DIRS = new Set(['node_modules', '.next', '.git', 'supabase', 'scripts', 'public'])

/*
 * Known false positives, each with the reason.
 *
 * Every one of these is a key inside a jsonb column or a plain local variable
 * that the parser cannot tell apart from a column. The rule for adding one:
 * you must have opened the file and confirmed it, and the note must say what
 * it actually is.
 */
const ALLOW = new Set([
  'profiles.circle', //            key inside the child_permissions jsonb
  'profiles.program', //           key inside the child_permissions jsonb
  'saved_meals.food_item_id', //   key inside the items jsonb array
  'saved_meals.quantity', //       key inside the items jsonb array
  'transformation_state.headline', // key inside the state_json jsonb
  'studio_items.today', //         a local `today` variable, not a column
  'kid_rewards.note', //           a function parameter, not a column
])

function loadSchema() {
  const out = new Map()
  for (const line of readFileSync(SNAPSHOT, 'utf8').split('\n')) {
    if (!line.trim() || line.startsWith('#')) continue
    const [table, cols] = line.split('|')
    if (!table || !cols) continue
    out.set(table.trim(), new Set(cols.split(',').map((c) => c.trim())))
  }
  return out
}

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name) || name.startsWith('.fuse_hidden')) continue
    const p = join(dir, name)
    const st = statSync(p)
    if (st.isDirectory()) yield* walk(p)
    else if (['.ts', '.tsx'].includes(extname(name))) yield p
  }
}

/** Column names used on one `.from()` chain. */
function columnsInChain(tail) {
  const cols = new Set()

  // .select('a, b, rel:other(x)') — split on top-level commas only, so a
  // nested relation does not have its inner columns read as this table's.
  for (const m of tail.matchAll(/\.select\(\s*[`'"]([^`'"]*)[`'"]/g)) {
    let depth = 0
    let buf = ''
    for (const ch of m[1]) {
      if (ch === '(') depth++
      else if (ch === ')') depth--
      else if (ch === ',' && depth === 0) {
        cols.add(buf)
        buf = ''
        continue
      }
      if (depth === 0 && ch !== '(' && ch !== ')') buf += ch
    }
    cols.add(buf)
  }

  const filters = ['eq', 'neq', 'gte', 'lte', 'gt', 'lt', 'order', 'is', 'like', 'ilike', 'contains', 'overlaps', 'not']
  for (const fn of filters) {
    for (const m of tail.matchAll(new RegExp(`\\.${fn}\\(\\s*['"]([a-z0-9_]+)['"]`, 'g'))) cols.add(m[1])
  }

  // Object keys handed to insert / update / upsert.
  for (const m of tail.matchAll(/\.(?:insert|update|upsert)\(\s*\{([\s\S]*?)\}\s*[,)]/g)) {
    for (const k of m[1].matchAll(/(?:^|[{\s,])([a-z][a-z0-9_]*)\s*:/g)) cols.add(k[1])
  }

  /*
   * Never column names, and all four turn up as the left side of a colon in
   * ordinary TypeScript — a ternary like `x ? null : y` inside an update
   * object reads to the key regex exactly like a column would.
   */
  const KEYWORDS = new Set(['null', 'true', 'false', 'undefined'])

  return [...cols]
    .map((c) => c.trim())
    .filter((c) => c && c !== '*' && !KEYWORDS.has(c) && /^[a-z][a-z0-9_]*$/.test(c))
}

const schema = loadSchema()
const problems = []
let checked = 0

for (const file of walk(ROOT)) {
  const src = readFileSync(file, 'utf8')
  for (const m of src.matchAll(/\.from\(\s*['"]([a-z_]+)['"]\s*\)/g)) {
    const table = m[1]
    if (!schema.has(table)) continue // a view, an rpc, or a table we do not track
    let tail = src.slice(m.index + m[0].length, m.index + m[0].length + 900)
    const next = tail.indexOf('.from(')
    if (next > 0) tail = tail.slice(0, next)

    for (const col of columnsInChain(tail)) {
      checked++
      const key = `${table}.${col}`
      if (ALLOW.has(key)) continue
      if (!schema.get(table).has(col)) {
        const line = src.slice(0, m.index).split('\n').length
        problems.push({ key, file: file.replace(ROOT + '/', ''), line })
      }
    }
  }
}

const unique = [...new Map(problems.map((p) => [p.key + p.file, p])).values()]

if (unique.length === 0) {
  console.log(`✓ ${checked} column references, ${schema.size} tables — all present.`)
  process.exit(0)
}

console.error(`\n✗ ${unique.length} column reference(s) that do not exist:\n`)
for (const p of unique) console.error(`  ${p.key}\n      ${p.file}:${p.line}`)
console.error(
  '\nIf one of these is a key inside a jsonb column rather than a real column,' +
    '\nadd it to ALLOW in this file with a note saying what it actually is.' +
    '\nIf the schema changed, refresh supabase/schema-snapshot.txt.\n',
)
process.exit(1)
