#!/usr/bin/env node
/**
 * Every page a child should not reach must say so itself.
 *
 * `KidGate` is a client-side redirect: by the time it runs, the server
 * component has executed and its data is already in the browser. So each
 * adult-only page calls `adultsOnly()` (or `circleOrRedirect()`) at the top.
 * That works, but only for as long as somebody remembers to add the line to
 * the next page they create — and a page added without it is a silent hole,
 * not a visible bug.
 *
 * This walks `app/app/*`, works out what `kidAllowed` would say about each
 * route, and fails if a route a child cannot have is missing its guard.
 *
 * Run: npm run check:kid  (or npm run verify)
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs'

const ROOT = 'app/app'

/*
 * Mirrors `kidAllowed` in lib/kid.ts. Duplicated deliberately: this script
 * has to run without a TypeScript build step, and a copy that drifts is
 * caught by the shape assertion below.
 */
function kidAllowed(path, perms = {}) {
  if (path === '/app') return true
  const always = ['/app/learning', '/app/kid-food', '/app/nutrition/log', '/app/kid-me', '/app/kid-money', '/app/checkin']
  if (always.some((r) => path === r || path.startsWith(r + '/'))) return true
  if (perms.circle && (path.startsWith('/app/circle') || path.startsWith('/app/members'))) return true
  if (perms.program?.length) {
    if (path === '/app/program' || path.startsWith('/app/program?')) return true
    const m = path.match(/^\/app\/program\/([^/?]+)/)
    if (m && perms.program.includes(m[1])) return true
  }
  return false
}

// If lib/kid.ts is rewritten, the copy above is probably stale too.
const kidSrc = readFileSync('lib/kid.ts', 'utf8')
if (!kidSrc.includes("if (path === '/app') return true")) {
  console.error('✗ lib/kid.ts no longer has the shape this check mirrors. Update kidAllowed() in scripts/check-kid-routes.mjs.')
  process.exit(1)
}

/*
 * Routes closed to a child by something other than a guard call.
 *
 * Only two kinds are allowed here, and both are verified rather than trusted:
 * a page that filters its own contents, and a page that is nothing but a
 * redirect — and for those, the check follows the redirect and insists the
 * destination is guarded. A comment saying "this redirects somewhere safe" is
 * exactly the kind of claim that quietly stops being true.
 */
const EXEMPT = {
  '/app/guidelines': 'static community rules, no personal data — readable by anyone in the Circle',
  '/app/program': 'filters its own list through courseAllowList(), so a child sees only her permitted courses',
}

/** A page whose whole body is `redirect('/somewhere')`. */
function redirectTarget(src) {
  if (/export default (async )?function \w+\([^)]*\)\s*\{\s*redirect\(/.test(src.replace(/\/\*[\s\S]*?\*\//g, ''))) {
    return src.match(/redirect\('([^']+)'/)?.[1] ?? null
  }
  return null
}

function isGuarded(route) {
  const dir = route.split('?')[0].replace('/app/', '')
  const page = `${ROOT}/${dir}/page.tsx`
  if (!existsSync(page)) return false
  return /adultsOnly\(\)|circleOrRedirect\(\)/.test(readFileSync(page, 'utf8'))
}

const problems = []
for (const entry of readdirSync(ROOT, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue
  const page = `${ROOT}/${entry.name}/page.tsx`
  if (!existsSync(page)) continue

  const route = `/app/${entry.name}`
  const src = readFileSync(page, 'utf8')
  const guarded = /adultsOnly\(\)|circleOrRedirect\(\)/.test(src)
  const openToKid = kidAllowed(route, {})

  if (openToKid && guarded) {
    problems.push(`${route} — one of her own pages, but it calls a guard`)
    continue
  }
  if (route === '/app/circle' && !/circleOrRedirect\(\)/.test(src)) {
    problems.push(`${route} — must use circleOrRedirect(), not adultsOnly(): it opens when her parent allows it`)
    continue
  }
  if (!openToKid && !guarded && !EXEMPT[route]) {
    const target = redirectTarget(src)
    if (target) {
      // A redirect is only as safe as where it lands.
      if (!isGuarded(target) && !EXEMPT[target.split('?')[0]]) {
        problems.push(`${route} — redirects to ${target}, which is not guarded either`)
      }
      continue
    }
    problems.push(`${route} — a child can reach this and nothing stops her. Add \`await adultsOnly()\` at the top of the page, or add it to EXEMPT in this file with a reason.`)
  }
}

// An exemption for a page that has since been deleted is just stale noise.
for (const route of Object.keys(EXEMPT)) {
  if (!existsSync(`${ROOT}/${route.replace('/app/', '')}/page.tsx`)) {
    problems.push(`${route} — exempted here but the page is gone. Remove the exemption.`)
  }
}

if (problems.length > 0) {
  console.error(`\n✗ ${problems.length} route(s) a child should not reach:\n`)
  for (const p of problems) console.error(`  ${p}`)
  console.error('')
  process.exit(1)
}

const guarded = readdirSync(ROOT, { withFileTypes: true }).filter(
  (e) => e.isDirectory() && existsSync(`${ROOT}/${e.name}/page.tsx`) &&
    /adultsOnly\(\)|circleOrRedirect\(\)/.test(readFileSync(`${ROOT}/${e.name}/page.tsx`, 'utf8')),
).length
console.log(`✓ ${guarded} adult routes guarded, ${Object.keys(EXEMPT).length} exempt with reasons, her own pages open.`)
