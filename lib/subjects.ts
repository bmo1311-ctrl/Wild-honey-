import {
  BookOpen,
  Brush,
  Calculator,
  Compass,
  Flower2,
  Globe2,
  HandHeart,
  Hammer,
  Languages,
  Music,
  PenLine,
  PersonStanding,
  Scroll,
  Sparkles,
  Sprout,
  Utensils,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

/**
 * What a person at home is learning.
 *
 * The subject used to be a text box, which meant every board grew its own
 * private vocabulary and nothing could ever be grouped. It also quietly
 * suggested that learning is the seven things school measures.
 *
 * So there are two families here and the second one is the point. The basics
 * are the basics and they matter. But gardening, an instrument, mending a
 * thing that broke, cooking a meal for someone else — those are not
 * enrichment around the edges of an education. For a childhood at home they
 * are quite often the education, and they had nowhere to live.
 */

export type SubjectFamily = 'basics' | 'wider'

export interface Subject {
  key: string
  label: string
  family: SubjectFamily
  icon: LucideIcon
  blurb: string
  /** A few openings, so a blank board is not a blank page. */
  ideas: string[]
}

export const SUBJECTS: Subject[] = [
  // ---- the basics ----
  {
    key: 'reading',
    label: 'Reading',
    family: 'basics',
    icon: BookOpen,
    blurb: 'stories, aloud and alone',
    ideas: ['Read aloud together, twenty minutes', 'A chapter on her own', 'Poetry on Fridays'],
  },
  {
    key: 'writing',
    label: 'Writing',
    family: 'basics',
    icon: PenLine,
    blurb: 'letters, journals, the shape of a sentence',
    ideas: ['Copywork, one passage', 'A letter to someone real', 'Journal, three lines'],
  },
  {
    key: 'numbers',
    label: 'Numbers',
    family: 'basics',
    icon: Calculator,
    blurb: 'maths, and measuring, and money',
    ideas: ['Maths lesson', 'Measure something for a real reason', 'Work out the change'],
  },
  {
    key: 'science',
    label: 'Science',
    family: 'basics',
    icon: Sparkles,
    blurb: 'how the world works, tested',
    ideas: ['One experiment', 'Keep a weather log', 'Take something apart'],
  },
  {
    key: 'history',
    label: 'History',
    family: 'basics',
    icon: Scroll,
    blurb: 'the people who came before',
    ideas: ['A story from history', 'Add to the timeline', 'Ask a grandparent something'],
  },
  {
    key: 'geography',
    label: 'Geography',
    family: 'basics',
    icon: Globe2,
    blurb: 'where things are, and who lives there',
    ideas: ['Find it on the map', 'Learn one country properly', 'Draw the route somewhere'],
  },
  {
    key: 'language',
    label: 'Language',
    family: 'basics',
    icon: Languages,
    blurb: 'another tongue, a little at a time',
    ideas: ['Ten minutes of practice', 'Five new words', 'Name things in the house'],
  },

  // ---- the wider life ----
  {
    key: 'music',
    label: 'Music',
    family: 'wider',
    icon: Music,
    blurb: 'an instrument, singing, listening properly',
    ideas: ['Practise, fifteen minutes', 'Learn a hymn', 'Listen to one whole piece, no phone'],
  },
  {
    key: 'art',
    label: 'Art',
    family: 'wider',
    icon: Brush,
    blurb: 'drawing, painting, making a mess on purpose',
    ideas: ['Draw what is in front of you', 'Copy a painting you love', 'Make something with your hands'],
  },
  {
    key: 'gardening',
    label: 'Gardening',
    family: 'wider',
    icon: Sprout,
    blurb: 'seeds, soil, and waiting',
    ideas: ['Water and check the beds', 'Plant something from seed', 'Harvest, and cook what you picked'],
  },
  {
    key: 'cooking',
    label: 'Cooking',
    family: 'wider',
    icon: Utensils,
    blurb: 'feeding yourself, and other people',
    ideas: ['Cook one meal start to finish', 'Bake bread', 'Plan and shop for a dinner'],
  },
  {
    key: 'nature',
    label: 'Nature',
    family: 'wider',
    icon: Compass,
    blurb: 'outside, in weather, noticing',
    ideas: ['A walk with nothing to find', 'Nature journal, one page', 'Learn a bird by its call'],
  },
  {
    key: 'handwork',
    label: 'Handwork',
    family: 'wider',
    icon: Hammer,
    blurb: 'sewing, whittling, building, mending',
    ideas: ['Mend something rather than replace it', 'Learn one stitch', 'Build a thing from wood'],
  },
  {
    key: 'movement',
    label: 'Movement',
    family: 'wider',
    icon: PersonStanding,
    blurb: 'a body that can do things',
    ideas: ['Outside, an hour', 'Learn to do it properly — swim, ride, climb', 'Stretch together'],
  },
  {
    key: 'faith',
    label: 'Faith',
    family: 'wider',
    icon: Flower2,
    blurb: 'scripture, prayer, and the questions',
    ideas: ['Read a passage together', 'Memorise one verse', 'Ask the hard question out loud'],
  },
  {
    key: 'money',
    label: 'Money & work',
    family: 'wider',
    icon: Wallet,
    blurb: 'earning, saving, giving, the worth of a thing',
    ideas: ['Earn something and save it', 'Give some away on purpose', 'Price a thing you want, honestly'],
  },
  {
    key: 'home',
    label: 'Home',
    family: 'wider',
    icon: HandHeart,
    blurb: 'the skills that keep a house running',
    ideas: ['Take one job and own it', 'Wash, dry, fold, put away', 'Fix something small'],
  },
  {
    key: 'service',
    label: 'Service',
    family: 'wider',
    icon: HandHeart,
    blurb: 'something for someone who cannot repay you',
    ideas: ['Do a kindness nobody sees', 'Help a neighbour', 'Write to someone who is alone'],
  },
]

export const BASICS = SUBJECTS.filter((s) => s.family === 'basics')
export const WIDER = SUBJECTS.filter((s) => s.family === 'wider')

export function getSubject(key: string): Subject | undefined {
  const k = key.trim().toLowerCase()
  return SUBJECTS.find((s) => s.key === k || s.label.toLowerCase() === k)
}

/**
 * The label to show for a subject that may predate the list.
 *
 * Boards written before there were subjects hold whatever she typed. Those
 * stay exactly as she wrote them rather than being forced into a category
 * she never chose.
 */
export function subjectLabel(key: string): string {
  return getSubject(key)?.label ?? key
}

export const FAMILY_LABEL: Record<SubjectFamily, string> = {
  basics: 'the basics',
  wider: 'the wider life',
}
