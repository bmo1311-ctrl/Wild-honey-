#!/usr/bin/env node
/**
 * Silence is not data.
 *
 * The one rule this app has above the others: **it may only say what she told
 * it.** If she did not log breakfast, the app knows nothing about breakfast —
 * not that she skipped it. She may have journalled on paper, prayed in the
 * car, eaten at her mother's. None of that is the app's to know, and none of
 * its absence is hers to be measured by.
 *
 * Two readings broke this and both are now deleted. `awareness` counted the
 * days she wrote *inside the app*, divided by fourteen, and showed her the
 * result as how much she was noticing about herself — so a woman with a paper
 * journal scored 21% on self-awareness. `alignment` treated not opening the
 * app as evidence her life did not match her values.
 *
 * Neither was a bug. Both were carefully written, well commented, and wrong
 * at the level of what the app believed it was entitled to say. That is
 * exactly the kind of mistake nothing else here catches: it type-checks, it
 * renders, the number is arithmetically correct, and it is still a claim
 * about a woman's inner life derived from her not having opened an app.
 *
 * So this looks for the *shape*: a count of her activity over a window of
 * days, presented as a proportion. And for copy that tells her what she did
 * not do.
 *
 * Run: npm run check:silence  (or npm run verify)
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'

const SKIP = new Set(['node_modules', '.next', '.git', 'public', '.sim'])

/**
 * Deliberately narrow.
 *
 * A check that fires on anything resembling a percentage would be turned off
 * within a week, and a check that is off catches nothing. These are the two
 * shapes that actually went wrong.
 */
const FORBIDDEN = [
  {
    // `days / 14`, `active / 10`, `count / WINDOW` — her participation over a
    // window, which is the exact arithmetic both deleted readings used.
    re: /\b(days|active|logged|checkinDays|writeDays|completed|done|kept)\b\s*\/\s*(\d+|WINDOW|RECENT_DAYS|\w*DAYS)\b/g,
    why: 'a count of her activity divided by a number of days. That is a measure of how much she used the app, and it cannot be shown to her as a fact about her.',
  },
  {
    /*
     * "3 of the last 14 days" — and the spelled-out version.
     *
     * The first pass only matched digits, and `lib/noticing.ts` deliberately
     * spells small numbers as words ("four days running" sounds noticed,
     * "4 days running" sounds counted). So "four of the last seven days" sat
     * there passing a check written to forbid exactly that shape. The
     * engine's own comment said it counts what she did and never what she
     * missed; a denominator smuggles the missing half in without naming it.
     */
    re: /of the last \$\{?[\w.]+\}?\s*days|\bof the last (\d+|one|two|three|four|five|six|seven|eight|nine|ten|fourteen|thirty) days\b/gi,
    why: '"X of the last N days" reports her absence back to her as a finding.',
  },
  {
    // Copy that names what she did not do.
    /*
     * The first version of this was `you (only|haven't|...)` and it fired on
     * "if you only do one thing today" — which is the *good* copy, the whole
     * sized-to-the-day idea in one line. A check that flags the thing it is
     * meant to protect gets switched off.
     *
     * So: "only" counts when it is followed by something she did, not by an
     * offer of one thing to do.
     */
    re: /you (only (did|logged|managed|checked|wrote|got)|haven'?t|haven’t|didn'?t|didn’t|never|failed to|missed|fell behind|slipped)\b/gi,
    why: 'copy that tells her what she did not do. The app does not know that she did not do it — it knows she did not tell it.',
  },
  {
    re: /\b(adherence|compliance|completion[_ ]?rate|consistency[_ ]?score)\b/gi,
    why: 'this is attendance by another name.',
  },
]

/**
 * Places the shape is legitimate.
 *
 * Nutrition really is arithmetic on what she typed today, against a target
 * she set — that is not an inference from silence, it is a total she asked
 * for. The deleted readings are described in prose in several files and this
 * check should not fire on its own explanation.
 */
const ALLOW_FILES = new Set([
  'scripts/check-silence.mjs',
  'CONSCIOUSNESS.md',
  'ARCHITECTURE-MAP.md',
])

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

for (const file of walk('.')) {
  const rel = file.replace(/^\.\//, '')
  if (ALLOW_FILES.has(rel)) continue
  const src = readFileSync(file, 'utf8')
  const lines = src.split('\n')

  for (const { re, why } of FORBIDDEN) {
    for (const [i, line] of lines.entries()) {
      // A line that is only a comment is describing the rule, not breaking it.
      const code = line.replace(/^\s*(\/\/|\*|\/\*).*$/, '')
      if (!code.trim()) continue
      re.lastIndex = 0
      const m = re.exec(code)
      if (m) problems.push(`${rel}:${i + 1}  ${m[0].trim()}\n      ${why}`)
    }
  }
}

if (problems.length > 0) {
  console.error(`\n✗ ${problems.length} place(s) where the app measures her by her absence:\n`)
  for (const p of problems) console.error(`  ${p}\n`)
  console.error('  See CONSCIOUSNESS.md — "It may only say what she told it."\n')
  process.exit(1)
}

console.log('✓ nothing measures her by what she did not tell the app.')
