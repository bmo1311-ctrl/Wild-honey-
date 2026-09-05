/**
 * Feature flags.
 *
 * The nav stays at five tabs — Today · Program · Write · Circle · You — because
 * the daily loop should be small. But the library behind it is open: 19
 * resources, 60 recipes, 13 workouts and the rest were switched off during the
 * course-first rebuild and are switched back on here. Hiding built, populated
 * features is what made the app feel empty.
 *
 * `community` stays off because that route only redirects into Circle, which
 * is already on.
 */
export const FEATURES = {
  recipes: true,
  pantry: true,
  mealPlans: true,
  groceries: true,
  energy: true,
  vault: true,
  archive: true,
  fixedCalendar: true,
  expertQA: true,
  shop: true,
  retreats: true,
  community: false,
  challenges: true,
  protocols: true,
  groups: true,
  progress: true,
}

export type FeatureName = keyof typeof FEATURES
