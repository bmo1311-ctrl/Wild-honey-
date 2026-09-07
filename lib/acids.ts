/**
 * Exfoliating acids, explained.
 *
 * Written from scratch for this app. Nothing here is lifted from anyone's
 * textbook or training manual.
 *
 * The scope is deliberately narrow: what a woman can buy and use at home,
 * and where the line is. Anything above roughly twenty per cent, anything
 * described as a professional or medium-depth peel, and anything involving
 * broken skin belongs to somebody licensed to assess her in person. This
 * file says so repeatedly and on purpose.
 *
 * It is education, not advice. It cannot see her skin, her history or her
 * prescriptions, and it says that too.
 */

export type AcidFamily = 'aha' | 'bha' | 'pha' | 'other'

export interface Acid {
  key: string
  name: string
  family: AcidFamily
  /** What it dissolves and where it can reach. */
  how: string
  /** Strengths sold for home use. */
  homeRange: string
  /** Who it tends to suit. */
  suits: string
  /** The honest downside. */
  cost: string
}

export const ACID_LIBRARY: Acid[] = [
  {
    key: 'glycolic',
    name: 'Glycolic acid',
    family: 'aha',
    how: 'The smallest molecule of the group, so it travels furthest into the skin. Works on the surface, loosening the glue between dead cells.',
    homeRange: '5–10% leave-on, or up to about 20% in a rinse-off mask',
    suits: 'Dullness, rough texture, fine lines. Skin that has used acids before.',
    cost: 'The most irritating of the AHAs, precisely because it gets furthest in. Not the one to start with.',
  },
  {
    key: 'lactic',
    name: 'Lactic acid',
    family: 'aha',
    how: 'A larger molecule than glycolic, so it works shallower and slower. It also holds water, so it hydrates while it exfoliates.',
    homeRange: '5–10% leave-on',
    suits: 'Dryness with dullness. A sensible first acid.',
    cost: 'Slower to show a difference, which is mostly a virtue.',
  },
  {
    key: 'mandelic',
    name: 'Mandelic acid',
    family: 'aha',
    how: 'The largest AHA molecule, so it penetrates slowest and most evenly.',
    homeRange: '5–10%',
    suits: 'Sensitive skin, and skin that marks easily after inflammation — the slower, more even action carries less risk of leaving a dark patch behind.',
    cost: 'Gentle enough that impatience is the main risk.',
  },
  {
    key: 'salicylic',
    name: 'Salicylic acid',
    family: 'bha',
    how: 'Oil-soluble, which is the whole point — it can get down inside a pore full of sebum, where water-soluble acids cannot.',
    homeRange: '0.5–2%',
    suits: 'Congestion, blackheads, breakouts, oily areas. Can be used just where the problem is.',
    cost: 'Drying if used everywhere, every day. It is a spot treatment more often than a full-face one.',
  },
  {
    key: 'pha',
    name: 'PHAs — gluconolactone, lactobionic',
    family: 'pha',
    how: 'Much larger molecules again, so they stay near the surface and hold water while they work.',
    homeRange: '4–10%',
    suits: 'Skin that reacts to everything. Rosacea-prone skin, in many cases.',
    cost: 'Genuinely mild. If nothing else has been tolerated, this is where to start.',
  },
  {
    key: 'azelaic',
    name: 'Azelaic acid',
    family: 'other',
    how: 'Not really an exfoliant. It calms inflammation and interferes with pigment production.',
    homeRange: '10% over the counter; higher by prescription',
    suits: 'Redness, breakouts and uneven tone at the same time — an unusual combination to get in one bottle.',
    cost: 'Can tingle at first. Slow to work; months, not weeks.',
  },
]

export interface Rule {
  title: string
  body: string
  /** True when getting this wrong actually hurts. */
  hard?: boolean
}

/** How often, and how strong, without going past what is sold for home use. */
export const STRENGTH_RULES: Rule[] = [
  {
    title: 'Daily, if anything',
    body: 'Salicylic up to 2%, a PHA, or a low-percentage AHA in a toner. These are the ones a normal barrier can take most days — though most skin does better on fewer.',
  },
  {
    title: 'Once or twice a week',
    body: 'A 5–10% AHA left on, or a rinse-off mask up to about 20%. This is where most visible change actually comes from, and where most people over-reach.',
  },
  {
    title: 'Above roughly 20%, stop',
    hard: true,
    body: 'Higher percentages, low-pH formulas and anything sold as a professional or medium-depth peel need someone licensed who can look at your skin, take a history and manage it if it goes wrong. That is not caution for its own sake — depth is where scarring and lasting pigment change live.',
  },
]

/** What can go with what, on the same night and in the same routine. */
export const LAYERING_RULES: Rule[] = [
  {
    title: 'One acid, one night',
    hard: true,
    body: 'Two acids together is not twice the result, it is twice the irritation. Pick one and give it the night.',
  },
  {
    title: 'Never an acid and a retinoid on the same night',
    hard: true,
    body: 'Both speed up cell turnover by different routes. Together they routinely strip a barrier down to the point where nothing can be used for weeks. Alternate nights instead — which is what the app already does for you.',
  },
  {
    title: 'Keep acids away from benzoyl peroxide',
    hard: true,
    body: 'Benzoyl peroxide is an oxidiser. Layered with acids it is harsh, and it degrades other actives it sits next to. Different times of day at minimum, different days ideally.',
  },
  {
    title: 'Vitamin C wants its own slot',
    body: 'Not dangerous with acids, just wasteful and irritating. Vitamin C in the morning, acids at night, and both do their job.',
  },
  {
    title: 'The night after is for repair',
    body: 'Cleanser, moisturiser, nothing clever. This is not a wasted evening — it is when the work you did actually holds.',
  },
  {
    title: 'Sunscreen the next day is not optional',
    hard: true,
    body: 'Fresh skin burns and marks more easily. Exfoliating without sun protection can leave you worse off than not exfoliating at all.',
  },
]

/** What to expect afterwards, and what is not normal. */
export const DOWNTIME: Rule[] = [
  {
    title: 'At home, there should be almost none',
    body: 'Slight tingling while it is on. Perhaps a little flaking on day two or three. That is the whole of it.',
  },
  {
    title: 'Stinging that does not settle, or skin that stays red',
    hard: true,
    body: 'Take it off, go back to cleanser and moisturiser only, and leave acids alone for a fortnight. Burning, swelling, blistering, or weeping skin is not a purge and not a normal reaction — that needs a doctor, the same day.',
  },
  {
    title: 'Peeling is not the goal',
    body: 'Visible peeling means you went further than you needed to. The result comes from consistency at a strength your skin can take, not from a dramatic week.',
  },
]

/**
 * When not to.
 *
 * Every one of these is a stop, not a slow down, and several of them are the
 * sort of thing that only a person who knows her history would think to ask.
 */
export const CONTRAINDICATIONS: Rule[] = [
  {
    title: 'Isotretinoin, now or recently',
    hard: true,
    body: 'While taking it, and for a good while after stopping, skin heals differently. Acids are off the table until the doctor who prescribed it says otherwise.',
  },
  {
    title: 'Broken or inflamed skin',
    hard: true,
    body: 'Cuts, eczema flares, sunburn, an active cold sore. Acids on broken skin can spread an infection and can scar.',
  },
  {
    title: 'Recent treatments',
    hard: true,
    body: 'Waxing, laser, microneedling, threading. Give it a clear week at least, and follow whatever the person who did it told you.',
  },
  {
    title: 'Medication that makes you burn more easily',
    body: 'Some antibiotics, some acne medication, some others. If a prescription label mentions sun sensitivity, ask a pharmacist before adding acids.',
  },
  {
    title: 'Melasma',
    body: 'Acids sometimes help it and sometimes make it considerably worse, and which way it goes is not predictable from a bottle. Worth proper guidance rather than experimentation.',
  },
  {
    title: 'Skin that marks after a spot',
    body: 'If breakouts tend to leave brown marks for months, aggressive exfoliation can deepen them. Gentler acids, lower strengths, more patience.',
  },
]

/**
 * Pregnancy, trying, and feeding.
 *
 * The rule here is to flag, never to clear. This file does not know her
 * history and is not her midwife, and there is no version of "probably fine"
 * that is worth writing down for someone who is pregnant.
 */
export const LIFE_STAGE_NOTES: Rule[] = [
  {
    title: 'Retinoids: no',
    hard: true,
    body: 'Vitamin A derivatives are the one clear line, and it is worth stopping before conception rather than after a positive test.',
  },
  {
    title: 'Everything else: ask, and ask specifically',
    hard: true,
    body: 'Salicylic, glycolic, azelaic, hydroquinone — guidance differs by strength, by how much skin it covers, by how often, and by her own history. That is exactly the sort of question a midwife or doctor answers well and an app answers badly. Bring the actual bottle and the actual percentage to the appointment.',
  },
  {
    title: 'What the app will do',
    body: 'Flag anything on your shelf worth raising, and hold the question until you have had it answered. It will not tell you something is safe.',
  },
]

export const SCOPE_NOTE =
  'Educational, and general. It cannot see your skin, your history or your prescriptions. Anything persistent, painful or worrying belongs with a doctor or a licensed professional rather than an app.'
