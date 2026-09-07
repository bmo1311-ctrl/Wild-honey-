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
  // Off: generic streak-style challenges never earned their place. If they
  // come back it will be as aspirational goals tied to the transformation,
  // not as a tab that exists because most apps have one.
  challenges: false,
  protocols: true,
  groups: true,
  progress: true,
}

export type FeatureName = keyof typeof FEATURES
