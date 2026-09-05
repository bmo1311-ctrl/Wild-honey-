import { BookOpen, ChefHat, Dumbbell, LibraryBig, type LucideIcon, Play, Sun, User, Users } from 'lucide-react'
import { FEATURES } from '@/lib/features'
import type { TodoRow } from '@/components/today-checklist'

/**
 * One registry for every area of the app.
 *
 * The nav, the Library doors, and the "What today needs" list are all built
 * from this list — so adding an area is one entry here rather than four edits
 * that have to agree with each other. Anything new appears everywhere it
 * belongs, automatically, and a flag set to false removes it everywhere at once.
 */

export interface TodayContext {
  courseDay: { number: number; title: string; kind: string; minutes: number } | null
  courseDayDone: boolean
  checkedInToday: boolean
  mealsLoggedToday: number
  habits: { id: string; title: string; anchor: string | null; doneToday: boolean }[]
}

export interface ModuleCounts {
  videos: number
  recipes: number
  workouts: number
  courseDays: number
}

export interface AppModule {
  key: string
  title: string
  href: string
  icon: LucideIcon
  blurb: string
  /** Feature flag name. Omit for areas that are always on. */
  flag?: keyof typeof FEATURES
  /** Slot in the five-tab bar. Lower numbers sit further left. */
  navOrder?: number
  /** Shown as a door on the Library page. */
  inLibrary?: boolean
  /** Pillar token used for the door's icon colour. */
  pillar?: 'body' | 'identity' | 'mindset' | 'faith'
  /** Count shown on the Library door. */
  count?: (c: ModuleCounts) => string
  /** Rows this area contributes to today's list. */
  todo?: (ctx: TodayContext) => TodoRow[]
}

export const MODULES: AppModule[] = [
  {
    key: 'today',
    title: 'Today',
    href: '/app',
    icon: Sun,
    blurb: 'your dashboard and what today needs',
    navOrder: 1,
  },
  {
    key: 'program',
    title: 'Program',
    href: '/app/program',
    icon: BookOpen,
    blurb: 'the course, week by week',
    navOrder: 2,
    todo: (ctx) =>
      ctx.courseDay
        ? [
            {
              key: 'course',
              kind: 'course',
              id: String(ctx.courseDay.number),
              label: `Day ${ctx.courseDay.number} · ${ctx.courseDay.title}`,
              hint: `${ctx.courseDay.kind} · ${ctx.courseDay.minutes} min`,
              done: ctx.courseDayDone,
            },
          ]
        : [],
  },
  {
    key: 'library',
    title: 'Library',
    href: '/app/library',
    icon: LibraryBig,
    blurb: 'everything outside the course',
    navOrder: 3,
  },
  {
    key: 'watch',
    title: 'Watch',
    href: '/app/vault',
    icon: Play,
    blurb: 'teaching on identity, mindset and faith',
    flag: 'vault',
    inLibrary: true,
    pillar: 'mindset',
    count: (c) => `${c.videos} videos`,
  },
  {
    key: 'nutrition',
    title: 'Nutrition',
    href: '/app/nutrition',
    icon: ChefHat,
    blurb: 'recipes, meal plans, grocery and pantry',
    flag: 'recipes',
    inLibrary: true,
    pillar: 'body',
    count: (c) => `${c.recipes} recipes`,
    todo: (ctx) => [
      {
        key: 'checkin',
        kind: 'link',
        href: '/app/nutrition',
        label: 'Log how you feel',
        hint: ctx.checkedInToday ? 'logged today' : 'energy, sleep, stress',
        done: ctx.checkedInToday,
      },
      {
        key: 'meals',
        kind: 'link',
        href: '/app/nutrition/log',
        label: 'Log what you ate',
        hint: ctx.mealsLoggedToday ? `${ctx.mealsLoggedToday} logged` : 'nothing logged yet',
        done: ctx.mealsLoggedToday > 0,
      },
    ],
  },
  {
    key: 'fitness',
    title: 'Fitness',
    href: '/app/fitness',
    icon: Dumbbell,
    blurb: 'strength, cardio and mobility',
    inLibrary: true,
    pillar: 'identity',
    count: (c) => `${c.workouts} workouts`,
  },
  {
    key: 'habits',
    title: 'Habits',
    href: '/app/becoming',
    icon: Sun,
    blurb: 'the small things you keep',
    todo: (ctx) =>
      ctx.habits.map((h) => ({
        key: `habit-${h.id}`,
        kind: 'habit' as const,
        id: h.id,
        label: h.title,
        hint: h.anchor ?? undefined,
        done: h.doneToday,
      })),
  },
  {
    key: 'circle',
    title: 'Circle',
    href: '/app/circle',
    icon: Users,
    blurb: 'the one feed',
    navOrder: 4,
  },
  {
    key: 'you',
    title: 'You',
    href: '/app/profile',
    icon: User,
    blurb: 'your writing, your becoming, your settings',
    navOrder: 5,
  },
]

export function isEnabled(m: AppModule): boolean {
  return m.flag ? Boolean(FEATURES[m.flag]) : true
}

/** The five-tab bar, in order. */
export function navModules(): AppModule[] {
  return MODULES.filter((m) => m.navOrder && isEnabled(m)).sort((a, b) => (a.navOrder ?? 0) - (b.navOrder ?? 0))
}

/** The Library doors. */
export function libraryModules(): AppModule[] {
  return MODULES.filter((m) => m.inLibrary && isEnabled(m))
}

/** Every enabled area's contribution to today's list, in registry order. */
export function todayRows(ctx: TodayContext): TodoRow[] {
  return MODULES.filter(isEnabled).flatMap((m) => m.todo?.(ctx) ?? [])
}
