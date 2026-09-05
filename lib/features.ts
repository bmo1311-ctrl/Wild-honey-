/**
 * Feature flags for the course-first rebuild.
 *
 * Nav is Today · Program · Write · Circle · You. Everything below is built,
 * tested and still in the tree — it is switched off, not deleted. Flip a
 * boolean to true and the route and its links come back exactly as they were.
 *
 * Stays on regardless: Today, Program, Write, Circle, profile, settings,
 * membership, workouts.
 */
export const FEATURES = {
  recipes: false,
  pantry: false,
  mealPlans: false,
  groceries: false,
  energy: false,
  vault: false,
  archive: false,
  fixedCalendar: false,
  expertQA: false,
  shop: false,
  retreats: false,
  community: false,
  challenges: false,
  protocols: false,
  groups: false,
  progress: false,
}

export type FeatureName = keyof typeof FEATURES
