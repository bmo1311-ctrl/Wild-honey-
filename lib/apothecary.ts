/**
 * The apothecary shelf.
 *
 * Herbal tea is the part of a wellness routine that gets treated as though it
 * were water. It is not. Several things on this shelf thin blood, move fluid,
 * shift blood pressure or carry enough iodine to matter to a thyroid — which
 * is exactly why they are worth logging, and exactly why they need notes.
 *
 * Two rules, the same ones the actives engine keeps.
 *
 * Traditional use is described as traditional use. Nothing here says a herb
 * treats, prevents or cures anything, because the honest answer for most of
 * this shelf is that the evidence is thin and the tradition is long.
 *
 * And it flags, never clears. There is no "safe in pregnancy" in this file.
 * A woman who is pregnant, trying, feeding, on medication or managing a
 * condition gets told which question to ask and who to ask it of.
 */

export type Concern =
  | 'pregnancy'
  | 'blood-thinners'
  | 'blood-pressure'
  | 'thyroid'
  | 'allergy'
  | 'iron'
  | 'reflux'
  | 'blood-sugar'

export const CONCERN_LABEL: Record<Concern, string> = {
  pregnancy: 'pregnant, trying, or feeding',
  'blood-thinners': 'on blood thinners',
  'blood-pressure': 'blood pressure medication',
  thyroid: 'thyroid condition or medication',
  allergy: 'ragweed or daisy-family allergy',
  iron: 'low iron',
  reflux: 'reflux',
  'blood-sugar': 'diabetes or blood-sugar medication',
}

export interface Herb {
  /** Matches the food_items name, so the log and the shelf agree. */
  key: string
  name: string
  /** What it has long been drunk for. Tradition, stated as tradition. */
  traditionally: string
  /** Who should ask before making it a daily habit. */
  concerns: Concern[]
  /** The specific thing worth raising, in one sentence. */
  note?: string
}

export const APOTHECARY: Herb[] = [
  {
    key: 'chamomile',
    name: 'Chamomile',
    traditionally: 'Drunk in the evening to settle. One of the oldest and gentlest things on the shelf.',
    concerns: ['allergy', 'blood-thinners', 'pregnancy'],
    note: 'It is in the daisy family — if ragweed or chrysanthemums bother you, this can too. Also worth raising if you take anything that thins blood.',
  },
  {
    key: 'prickly-pear',
    name: 'Prickly pear',
    traditionally: 'Long used across the Southwest and Mexico, and drunk for the fruit itself as much as anything.',
    concerns: ['blood-sugar'],
    note: 'Studied mostly for its effect on blood sugar, which matters if you take medication for it.',
  },
  {
    key: 'peppermint',
    name: 'Peppermint',
    traditionally: 'For a full or unsettled stomach.',
    concerns: ['reflux'],
    note: 'It relaxes the valve at the top of the stomach, so it can make reflux worse rather than better.',
  },
  {
    key: 'ginger',
    name: 'Ginger',
    traditionally: 'For nausea and for cold hands. The best-evidenced thing on this shelf.',
    concerns: ['blood-thinners', 'pregnancy'],
    note: 'Commonly discussed in pregnancy for morning sickness, and commonly discussed at what amount — a question for your midwife rather than a mug.',
  },
  {
    key: 'rooibos',
    name: 'Rooibos',
    traditionally: 'A caffeine-free red bush tea from South Africa, drunk all day.',
    concerns: [],
  },
  {
    key: 'hibiscus',
    name: 'Hibiscus',
    traditionally: 'Sharp, red and sour. Drunk cold across West Africa and the Caribbean.',
    concerns: ['blood-pressure', 'pregnancy'],
    note: 'Reliably lowers blood pressure a little, which is either the point or a problem depending on your medication. Usually advised against in pregnancy.',
  },
  {
    key: 'nettle',
    name: 'Nettle leaf',
    traditionally: 'A spring tonic. Genuinely mineral-rich rather than merely described that way.',
    concerns: ['blood-thinners', 'pregnancy'],
    note: 'High in vitamin K, which is what makes it worth raising if you take warfarin.',
  },
  {
    key: 'red-raspberry-leaf',
    name: 'Red raspberry leaf',
    traditionally: 'Associated with late pregnancy for a very long time, and with periods more generally.',
    concerns: ['pregnancy'],
    note: 'This is the one on the shelf most tied to pregnancy, and the timing is the whole question. Ask your midwife before, not after.',
  },
  {
    key: 'lemon-balm',
    name: 'Lemon balm',
    traditionally: 'For a busy head in the evening.',
    concerns: ['thyroid'],
    note: 'Some evidence it interacts with thyroid function, so worth mentioning if you take thyroid medication.',
  },
  {
    key: 'spearmint',
    name: 'Spearmint',
    traditionally: 'Gentler than peppermint. Studied a little in relation to hormonal acne and facial hair.',
    concerns: ['pregnancy'],
  },
  {
    key: 'tulsi',
    name: 'Tulsi, or holy basil',
    traditionally: 'A daily herb in Ayurvedic practice, drunk for stress.',
    concerns: ['pregnancy', 'blood-thinners', 'blood-sugar'],
    note: 'Questions have been raised about fertility and pregnancy — worth asking about specifically if either applies.',
  },
  {
    key: 'dandelion',
    name: 'Dandelion root',
    traditionally: 'A bitter, drunk for digestion and as a coffee substitute.',
    concerns: ['allergy', 'blood-pressure'],
    note: 'Also a daisy-family plant, and a real diuretic — which matters alongside blood pressure or fluid medication.',
  },
  { key: 'fennel', name: 'Fennel', traditionally: 'After a meal, for bloating.', concerns: ['pregnancy'] },
  {
    key: 'rosehip',
    name: 'Rosehip',
    traditionally: 'Drunk through winter. Genuinely carries vitamin C.',
    concerns: [],
  },
  {
    key: 'oat-straw',
    name: 'Oat straw',
    traditionally: 'A mild nervine, drunk over weeks rather than for an evening.',
    concerns: [],
  },
  {
    key: 'elderberry',
    name: 'Elderberry',
    traditionally: 'Through cold season, usually as syrup.',
    concerns: ['pregnancy'],
    note: 'Raw or underripe elderberries are genuinely not safe — this belongs to prepared syrup and properly brewed tea, never the fresh berry.',
  },
  {
    key: 'matcha',
    name: 'Matcha',
    traditionally: 'Whole leaf, so more caffeine than brewed green tea and a slower curve.',
    concerns: ['iron', 'pregnancy'],
    note: 'Tannins bind iron, so drinking it with meals works against you if your iron is low. Caffeine is worth counting in pregnancy.',
  },
  { key: 'lavender', name: 'Lavender', traditionally: 'For sleep, and for the smell as much as the drink.', concerns: ['pregnancy'] },
  {
    key: 'cinnamon',
    name: 'Cinnamon',
    traditionally: 'Warming, and long associated with blood sugar.',
    concerns: ['blood-sugar', 'pregnancy'],
    note: 'Cassia cinnamon — the ordinary supermarket kind — carries coumarin, which is worth knowing about if you drink it daily rather than occasionally.',
  },
  {
    key: 'turmeric',
    name: 'Turmeric',
    traditionally: 'Anti-inflammatory in the traditional sense, and drunk with black pepper and fat for a reason.',
    concerns: ['blood-thinners', 'pregnancy'],
    note: 'Culinary amounts and supplement amounts are very different things, and the caution is about the second.',
  },
  {
    key: 'sea-moss',
    name: 'Sea moss',
    traditionally: 'A Caribbean staple, taken as gel.',
    concerns: ['thyroid'],
    note: 'Iodine content varies enormously between batches, and both too little and too much iodine affect a thyroid. This is the one on the shelf where the dose is genuinely unpredictable.',
  },
  {
    key: 'apple-cider-vinegar',
    name: 'Apple cider vinegar',
    traditionally: 'Before meals, for digestion.',
    concerns: ['reflux', 'blood-sugar'],
    note: 'Always diluted. Neat, it is hard on tooth enamel and on the throat.',
  },
  {
    key: 'raw-honey',
    name: 'Raw honey',
    traditionally: 'For throats, and for everything else.',
    concerns: [],
    note: 'Never for a baby under one year old. That one is not a caution to discuss, it is a rule.',
  },
]

export function herbFor(foodName: string): Herb | undefined {
  const n = foodName.toLowerCase()
  return APOTHECARY.find((h) => n.includes(h.key.replace(/-/g, ' ')) || n.includes(h.name.toLowerCase().split(',')[0]))
}

/** Everything on her shelf worth raising, given where she is. */
export function concernsFor(herbs: Herb[], concerns: Concern[]): { herb: Herb; concern: Concern }[] {
  const out: { herb: Herb; concern: Concern }[] = []
  for (const herb of herbs) {
    for (const c of herb.concerns) {
      if (concerns.includes(c)) out.push({ herb, concern: c })
    }
  }
  return out
}

export const APOTHECARY_SCOPE =
  'Traditional use, not medical advice. Herbs interact with medication and with each other, and the amount in a daily mug is different from the amount in a capsule. Anything you take every day is worth mentioning to your doctor, pharmacist or midwife — they will not mind being asked.'
