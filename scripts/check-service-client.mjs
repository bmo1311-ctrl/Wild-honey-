#!/usr/bin/env node
/**
 * The service client bypasses Row Level Security completely.
 *
 * Every other protection in this app — a woman's journal, another household's
 * children, a group she is not in — is a policy on a table, and the service
 * role ignores all of them. So a new `createServiceClient()` is the single
 * highest-risk line anyone can add here, and it is four words that look
 * exactly like the ordinary client sitting next to them.
 *
 * Nothing noticed. `tsc` cannot tell the difference, the checks for columns,
 * kid routes and access all look elsewhere, and the audits that found the
 * other holes only found them because someone went looking that week.
 *
 * So: every call site is listed below with the reason it is allowed. A new
 * one fails this check until it is added here, which makes adding it a
 * deliberate act with a sentence attached rather than an import that happened
 * to be in scope.
 *
 * Run: npm run check:service  (or npm run verify)
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'

/**
 * file -> the reasons, one per call site in that file.
 *
 * The count has to match too. Two uses in a file where this expects one means
 * a second thing was added under cover of the first one's justification.
 */
const ALLOWED = {
  'app/actions.ts': [
    'joinGroupByCode — the invite_code policy makes the row unreadable until she is a member, and she cannot become one until it is read. Presenting a correct code IS the authorisation; the query matches the exact code and selects only the id.',
    'deleteMyAccount — deletes auth.users for `user.id` and nobody else. Only the auth admin API can do this, and cascade does the rest.',
    'adminRemoveReportedContent — there is no admin DELETE policy on any content table, so moderation through the ordinary client matched zero rows and reported success. requireAdmin() has already run.',
    'createChildAccess — creates the child auth user and her profile row. Verifies the member is in the caller’s own household first.',
    'lookupFamily — a child typing her family code has no session yet. Returns first names only, which is the deliberate trade that makes the "who are you?" screen work.',
    'childCredentials — same, and now verifies the member belongs to that code and counts attempts.',
    'setChildPermissions — writes to the child’s profile row, which her parent does not own. Verifies the member is hers first.',
    'getChildPermissions — reads that same row for the parent.',
  ],
  'lib/data.ts': [
    'getReportsForAdmin — a report is usually about a group she is not in, where ordinary RLS returns nothing and that reads identically to "already deleted". Admin area only.',
  ],
  'lib/kid-auth.ts': [
    'secret() — kid_auth_secret has RLS on and no policies at all, deliberately unreadable to every session including hers.',
    'throttleChildSignin — the caller is not signed in yet, so there is no session to scope this to.',
    'clearChildSigninAttempts — same.',
  ],
  'lib/courses-db.ts': [
    'ensureCoursesSeeded — writes the bundled course JSON into an empty table on first boot, and refuses if anything is already there. Course content is public.',
  ],
  'app/api/webhooks/square/route.ts': [
    'Square webhook — called by Square’s servers, no user session exists. Signature-verified.',
  ],
  'app/api/cron/morning-reminder/route.ts': [
    'Cron — reads every profile to decide who to notify. Gated on CRON_SECRET.',
  ],
  'app/api/cron/evening-reminder/route.ts': [
    'Cron — same.',
  ],
}

/** Where the client itself is defined; not a use of it. */
const DEFINITION = 'lib/supabase/service.ts'

const SKIP = new Set(['node_modules', '.next', '.git', 'public', 'scripts'])

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue
    const full = `${dir}/${name}`
    if (statSync(full).isDirectory()) walk(full, out)
    else if (/\.(ts|tsx)$/.test(name)) out.push(full)
  }
  return out
}

const problems = []
const found = {}

for (const file of walk('.')) {
  const rel = file.replace(/^\.\//, '')
  if (rel === DEFINITION) continue
  const src = readFileSync(file, 'utf8')
  const calls = (src.match(/createServiceClient\(\)/g) ?? []).length
  if (calls > 0) found[rel] = calls
}

for (const [file, calls] of Object.entries(found)) {
  const reasons = ALLOWED[file]
  if (!reasons) {
    problems.push(
      `${file} uses createServiceClient() and is not on the list. ` +
        `That client ignores every RLS policy in the database. If it genuinely ` +
        `belongs here, add the file to ALLOWED in this script with one sentence ` +
        `per call site saying why RLS cannot do the job.`,
    )
    continue
  }
  if (calls !== reasons.length) {
    problems.push(
      `${file} has ${calls} call(s) to createServiceClient() but ${reasons.length} reason(s) listed. ` +
        `A new one was added under cover of an existing justification — write its own.`,
    )
  }
}

for (const file of Object.keys(ALLOWED)) {
  if (!found[file]) {
    problems.push(`${file} is listed in ALLOWED but no longer uses createServiceClient(). Take it off the list.`)
  }
}

if (problems.length > 0) {
  console.error(`\n✗ ${problems.length} problem(s) with service-role usage:\n`)
  for (const p of problems) console.error(`  ${p}\n`)
  process.exit(1)
}

const total = Object.values(found).reduce((a, b) => a + b, 0)
console.log(`✓ ${total} service-role call sites across ${Object.keys(found).length} files, each with a stated reason.`)
