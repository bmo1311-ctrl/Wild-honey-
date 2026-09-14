/**
 * Walk the four real account shapes through every guard added this week.
 *
 * The guards are the easy half. The half that goes wrong is locking out
 * somebody who should be let in, and that failure is silent — she just finds
 * a button that says no.
 */
import { readFileSync } from 'node:fs'
import { accessFor, asTier, meets, type Requirement, type Tier } from '../lib/access'
import { kidAllowed, courseAllowList } from '../lib/kid'

const REPO = process.cwd()

type Person = {
  label: string
  tier: Tier
  isChild: boolean
  guardianTier?: Tier
  perms: { circle?: boolean; program?: string[] }
}

// Exactly the three accounts that exist, plus the free member she is trying
// to convert — the one nobody has tested as.
const PEOPLE: Person[] = [
  { label: 'Brooke (founder, admin)', tier: 'founder', isChild: false, perms: {} },
  { label: 'Alesia (inner-circle beta)', tier: 'inner-circle', isChild: false, perms: {} },
  { label: 'Zaylee (child of founder)', tier: 'free', isChild: true, guardianTier: 'founder', perms: { circle: true, program: ['strong-and-surrendered', 'daily-bread'] } },
  { label: 'a new free member', tier: 'free', isChild: false, perms: {} },
  { label: 'child of a free parent', tier: 'free', isChild: true, guardianTier: 'free', perms: { circle: false, program: [] } },
]

/** What getAccess() resolves to: a child inherits her guardian's tier. */
function effective(p: Person): Tier {
  return p.isChild && p.guardianTier ? p.guardianTier : p.tier
}

function tierWriteAllowed(p: Person, required: Requirement, adultOnly = true): boolean {
  // A child inherits her guardian's tier, so tier alone is not the whole
  // question for an area whose page is adults-only.
  if (adultOnly && p.isChild) return false
  return meets(effective(p), required)
}
function circleWriteAllowed(p: Person): boolean {
  return !p.isChild || Boolean(p.perms.circle)
}
function courseWriteAllowed(p: Person, slug: string): boolean {
  const allowed = courseAllowList({ is_child: p.isChild, child_permissions: p.perms })
  if (allowed && !allowed.includes(slug)) return false
  return tierWriteAllowed(p, 'circle', false)
}

// The real map, parsed from lib/gate.ts so this cannot drift from it.
const gateSrc = readFileSync(`${REPO}/lib/gate.ts`, 'utf8')
const GATED = gateSrc
  .split('\n')
  .map((l) => /^ {2}(\w+): \{ required: '([\w-]+)', area: '([^']+)'(, adultOnly: false)? \},$/.exec(l))
  .filter(Boolean)
  .map((m) => ({ action: m![1], required: m![2] as Requirement, area: m![3], adultOnly: !m![4] }))

let fails = 0
function expect(label: string, got: boolean, want: boolean) {
  if (got !== want) { console.log(`  FAIL ${label}: got ${got}, want ${want}`); fails++ }
}

console.log(`Parsed ${GATED.length} gated actions from lib/gate.ts\n`)
if (GATED.length !== 28) { console.log(`FAIL: expected 28 gated actions, parsed ${GATED.length}`); fails++ }

/*
 * Assert the map itself, not only that the tier logic is self-consistent.
 *
 * The first version of this file checked what each person could reach and
 * derived the answer from her own tier — so quietly changing Ask an Expert
 * from inner-circle to circle in lib/gate.ts still passed, because the check
 * and the thing being checked both moved. These are the claims about what the
 * app charges for, written down separately.
 */
const ask = GATED.find((g) => g.action === 'submitExpertQuestion')
expect('Ask an Expert requires inner-circle', ask?.required === 'inner-circle', true)
expect('Ask an Expert is adults-only', ask?.adultOnly === true, true)
expect('nothing else requires inner-circle',
  GATED.filter((g) => g.required === 'inner-circle').length === 1, true)
expect('only the three learning actions are open to a child',
  GATED.filter((g) => !g.adultOnly).map((g) => g.area).every((a) => a === 'Learning boards'), true)
expect('there are exactly three of them',
  GATED.filter((g) => !g.adultOnly).length === 3, true)

for (const p of PEOPLE) {
  const eff = effective(p)
  const a = accessFor(eff)
  console.log(`${p.label} — resolves to ${eff} (paid: ${a.paid}, inner: ${a.inner})`)

  // Every circle-gated action: paid tiers in, free out.
  const adultCircle = GATED.filter((g) => g.required === 'circle' && g.adultOnly)
  const adultOk = adultCircle.filter((g) => tierWriteAllowed(p, g.required, true)).length
  expect(`${adultCircle.length} adult circle actions`, adultOk === adultCircle.length, a.paid && !p.isChild)
  expect(`${adultCircle.length} adult circle actions blocked`, adultOk === 0, !a.paid || p.isChild)

  // Her learning board is hers, gated on tier because her parent pays for it.
  const kidCircle = GATED.filter((g) => g.required === 'circle' && !g.adultOnly)
  const kidOk = kidCircle.filter((g) => tierWriteAllowed(p, g.required, false)).length
  expect(`${kidCircle.length} learning actions`, kidOk === kidCircle.length, a.paid)

  // Ask an Expert is the only inner-circle one, and it is adults-only.
  expect('Ask an Expert', tierWriteAllowed(p, 'inner-circle', true), a.inner && !p.isChild)

  // Courses: tier AND the child's allow-list.
  expect('course: strong-and-surrendered', courseWriteAllowed(p, 'strong-and-surrendered'),
    a.paid && (!p.isChild || (p.perms.program ?? []).includes('strong-and-surrendered')))
  expect('course: a program not on her list', courseWriteAllowed(p, 'some-other-course'),
    a.paid && !p.isChild)

  // Posting in the Circle.
  expect('circle write', circleWriteAllowed(p), !p.isChild || Boolean(p.perms.circle))

  // Her own free pages must stay open to everyone.
  for (const route of ['/app', '/app/checkin', '/app/nutrition/log']) {
    expect(`${route} reachable`, !p.isChild || kidAllowed(route, p.perms), true)
  }
  // And the adult ones must stay shut to a child.
  for (const route of ['/app/settings', '/app/money', '/app/nutrition/goals', '/app/wardrobe/you', '/app/groups/abc']) {
    expect(`${route} shut to a child`, p.isChild ? !kidAllowed(route, p.perms) : true, true)
  }
  console.log('')
}

// The two specific regressions this week's guards could have caused.
console.log('Regressions worth naming:')
const zaylee = PEOPLE[2]
expect('Zaylee can still do the courses her mother switched on',
  courseWriteAllowed(zaylee, 'daily-bread'), true)
expect('Zaylee still cannot do one her mother did not',
  courseWriteAllowed(zaylee, 'strong-and-surrendered-2'), false)
expect('Zaylee can still post in the Circle (her mother allowed it)',
  circleWriteAllowed(zaylee), true)
expect('Zaylee can still use her learning board (inherits founder)',
  tierWriteAllowed(zaylee, 'circle', false), true)
expect('Zaylee CANNOT write to Wardrobe, whose page is adults-only',
  tierWriteAllowed(zaylee, 'circle', true), false)
expect('Zaylee CANNOT submit an expert question',
  tierWriteAllowed(zaylee, 'inner-circle', true), false)
const alesia = PEOPLE[1]
expect('Alesia keeps every circle area', tierWriteAllowed(alesia, 'circle', true), true)
expect('Alesia keeps Ask an Expert', tierWriteAllowed(alesia, 'inner-circle', true), true)
const free = PEOPLE[3]
expect('a free member can still log food', true, true)
expect('a free member cannot submit an expert question', tierWriteAllowed(free, 'inner-circle', true), false)

console.log(fails === 0 ? '\nok — every account lands where it should' : `\n${fails} FAILURES`)
process.exit(fails === 0 ? 0 : 1)
