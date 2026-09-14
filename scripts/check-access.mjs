#!/usr/bin/env node
/**
 * What you charge for and what you gate must be the same list.
 *
 * They were not. The marketing page and the in-app membership page both
 * promised "Every workout, and the routines that keep you well" — and
 * Protocols, which is what that names, had no gate at all: tonight's plan,
 * the wash engine, the acids and actives libraries, the apothecary, free to
 * anyone with an account. Wardrobe and Studio were open too and appeared on
 * neither list, so nobody paying knew they were included and nobody free knew
 * they were getting them.
 *
 * Nothing catches that. It is not a type error, it does not crash, and both
 * halves look right on their own. It is only wrong when you read them side by
 * side — which is precisely what a script can do every time.
 *
 * Two things are checked:
 *   1. Every paid page is covered by a line on the membership list.
 *   2. The two copies of that list still agree with each other.
 *
 * Run: npm run check:access  (or npm run verify)
 */

import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs'

const APP = 'app/app'
const MEMBERSHIP = 'app/app/membership/page.tsx'
const MARKETING = 'app/page.tsx'

/**
 * Which membership line covers which gated route.
 *
 * A route appearing here is a claim that the list mentions it. The words on
 * the right have to actually appear in the membership copy, so renaming a
 * feature on the page without revisiting this fails rather than silently
 * un-documenting a thing people pay for.
 */
/*
 * Pages that read `access` to *show* something rather than to gate it.
 *
 * `/app/membership` is the obvious one: it reads her tier so it can say
 * whether she is already a member. Treating that as a paywall would demand a
 * membership line covering the membership page.
 */
const READS_ACCESS_BUT_IS_NOT_GATED = new Set(['membership'])

const COVERED_BY = {
  program: 'All four programs',
  vault: 'teaching library',
  library: 'teaching library',
  nutrition: 'Nourish',
  fitness: 'Every workout',
  protocols: 'Protocols',
  wardrobe: 'Wardrobe',
  studio: 'Studio',
  money: 'Freedom',
  learning: 'Learning boards',
  circle: 'Post, comment',
  ask: 'Ask the experts',
}

/*
 * Free on purpose, and the marketing page says so: "a read-only view of the
 * circle". `/app/members/[id]` is someone's opt-in public profile, so it is
 * part of reading the circle rather than part of posting in it. Listed here
 * so that its absence from COVERED_BY reads as a decision rather than an
 * oversight.
 */
const FREE_ON_PURPOSE = { members: 'reading the circle is free; only posting is not' }

/**
 * Is anything under this route behind the paywall?
 *
 * Deliberately recursive, and it counts an inline `<Locked>` as well as a
 * whole-page gate. Three real designs need that: `/app/program` lets her
 * browse the list and gates the day inside it; `/app/library` is a directory
 * whose doors are each gated; `/app/nutrition` keeps logging free and locks
 * recipes, grocery and pantry within the page. A per-page boolean calls all
 * three "free" and is simply wrong about them.
 */
function gatesAnywhere(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = `${dir}/${e.name}`
    if (e.isDirectory()) {
      if (gatesAnywhere(full)) return true
    } else if (e.name.endsWith('.tsx')) {
      // `meets(access.tier, …)` is how /app/library locks each door it lists.
      if (/access\.paid|access\.inner|requireTier\(|<Locked|meets\(access\.tier/.test(readFileSync(full, 'utf8'))) return true
    }
  }
  return false
}

const membership = readFileSync(MEMBERSHIP, 'utf8')
const marketing = readFileSync(MARKETING, 'utf8')
const problems = []

/* 1. Every page that charges is a page the list mentions. */
for (const entry of readdirSync(APP, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue
  const page = `${APP}/${entry.name}/page.tsx`
  if (!existsSync(page)) continue

  if (READS_ACCESS_BUT_IS_NOT_GATED.has(entry.name)) continue
  if (FREE_ON_PURPOSE[entry.name]) continue
  if (!gatesAnywhere(`${APP}/${entry.name}`)) continue

  const phrase = COVERED_BY[entry.name]
  if (!phrase) {
    problems.push(
      `/app/${entry.name} is behind the paywall but no membership line covers it. ` +
        `Add it to INCLUDED in ${MEMBERSHIP} and to COVERED_BY in this file — ` +
        `or, if it should be free, take the gate off.`,
    )
    continue
  }
  if (!membership.includes(phrase)) {
    problems.push(
      `/app/${entry.name} is covered by "${phrase}", which no longer appears in ${MEMBERSHIP}. ` +
        `The copy changed and this did not.`,
    )
  }
}

/* 2. The two lists still say the same things. */
for (const [route, phrase] of Object.entries(COVERED_BY)) {
  if (!existsSync(`${APP}/${route}`)) continue
  if (!gatesAnywhere(`${APP}/${route}`)) {
    problems.push(
      `/app/${route} is listed as included in The Circle but has no gate — it is free to anyone. ` +
        `Either gate it, or take "${phrase}" off the membership list.`,
    )
  }
}

// The marketing page sells the same thing; it should not promise more or less.
for (const phrase of ['Protocols', 'Wardrobe', 'Studio', 'Every workout', 'Nourish', 'Freedom']) {
  if (membership.includes(phrase) && !marketing.includes(phrase)) {
    problems.push(`"${phrase}" is on the in-app membership list but not on ${MARKETING}.`)
  }
}

/*
 * 3. The gate is on the *actions*, not only on the pages.
 *
 * `LockedArea` decides what renders. A server action is a plain POST whose id
 * ships in the client bundle, and RLS on every one of these tables checks
 * ownership and says nothing about tier — so before this, a free account
 * could write to every paid area in the app, including submitting a question
 * to Ask an Expert, which is Inner Circle.
 *
 * The map in lib/gate.ts is the list of actions that must carry a guard. The
 * thing that will go wrong next is a *new* write action added to a gated
 * area, and it will go wrong silently, so this reads the map and checks each
 * one still calls `tierWriteAllowed` inside its own body.
 */
const gateSrc = readFileSync('lib/gate.ts', 'utf8')
const actionsSrc = readFileSync('app/actions.ts', 'utf8')
const gatedActions = [...gateSrc.matchAll(/^ {2}(\w+): \{ required:/gm)].map((m) => m[1])

if (gatedActions.length === 0) {
  problems.push('GATED_ACTIONS in lib/gate.ts parsed as empty — this check is not checking anything.')
}

const bodies = new Map()
{
  const lines = actionsSrc.split('\n')
  let current = null
  for (const line of lines) {
    const m = /^export async function (\w+)\(/.exec(line)
    if (m) current = m[1]
    if (current) bodies.set(current, (bodies.get(current) ?? '') + line + '\n')
  }
}

for (const name of gatedActions) {
  const body = bodies.get(name)
  if (!body) {
    problems.push(
      `GATED_ACTIONS names \`${name}\`, which no longer exists in app/actions.ts. ` +
        `Renamed or deleted — either way the map is now lying about what is guarded.`,
    )
    continue
  }
  if (!body.includes('tierWriteAllowed(')) {
    problems.push(
      `\`${name}\` is listed in GATED_ACTIONS but does not call tierWriteAllowed(). ` +
        `A free account can write to that area by posting the action directly.`,
    )
  }
}

if (problems.length > 0) {
  console.error(`\n✗ ${problems.length} place(s) where what you charge for and what you gate disagree:\n`)
  for (const p of problems) console.error(`  ${p}\n`)
  process.exit(1)
}

console.log(`✓ ${Object.keys(COVERED_BY).length} paid areas, each named on the membership list and on the marketing page.`)
console.log(`✓ ${gatedActions.length} write actions in those areas each check the tier themselves.`)
