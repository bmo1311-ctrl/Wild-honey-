import { getAccess } from '@/lib/data'
import { meets, TIER_NAME, type Requirement } from '@/lib/access'

/**
 * The paywall, on the actions rather than on the pages.
 *
 * `LockedArea` on a page decides what to *render*. It does not decide what
 * can be *written*, and those are not the same question: a server action is a
 * plain POST whose id ships in the client bundle, and a free member's session
 * is valid app-wide. So every gated area's writes were open — a free account
 * could add garments, start protocols, log money, and submit a question to
 * Ask an Expert, which is Inner Circle.
 *
 * This is the same finding as the child gate, one level up. That one said
 * page guards close the door and not the action; nothing about it was
 * specific to children.
 *
 * The database does not close it either. Every one of these tables —
 * `wardrobe_items`, `studio_items`, `money_accounts`, `expert_questions`,
 * `protocol_enrollments`, `member_products` — has an ownership policy and
 * only an ownership policy: `auth.uid() = user_id` and nothing about tier.
 * `community_posts` requires `is_paid()`; none of these do.
 *
 * Deliberately *not* fixed in RLS. `is_paid()` is a boolean, and `ask` needs
 * Inner Circle rather than paid-at-all, so half of these want a rule the
 * database does not currently express. Tier also changes the moment Square
 * says so, and a policy that silently starts rejecting a woman's own rows
 * mid-session is a worse failure than a sentence telling her why.
 */

/**
 * What a gated action hands back.
 *
 * Adding an error branch to twenty-eight actions widens every one of their
 * return types into a union, and `res?.error` at the call sites then stops
 * compiling even though the runtime shape is fine — exactly what happened
 * when the child guard went into the social actions. One declared shape means
 * the *next* guard added to any of these costs nothing at the call sites.
 *
 * The three optional extras are the fields these actions genuinely return:
 * `completed` from a protocol day, `done` from a learning item, `stage` from
 * moving a studio item along.
 */
export type GatedResult = {
  error?: string
  ok?: boolean
  completed?: boolean
  done?: boolean
  stage?: string
}

/** Honest about which of these actually cost her something. */
const WHY: Record<Requirement, (area: string) => string> = {
  circle: (area) => `${area} is part of The Circle. Join to use it.`,
  'inner-circle': (area) => `${area} is part of ${TIER_NAME['inner-circle']}.`,
}

/**
 * May this account write to a gated area?
 *
 * Returns an error object rather than redirecting, for the same reason
 * `circleWriteAllowed` does: a server action should answer its caller rather
 * than throw a navigation at her. Every call site already handles `{ error }`
 * by showing a toast.
 *
 * `getAccess` is built on the memoised `getSessionProfile` and resolves a
 * child to her guardian's tier, so this costs nothing on a page that has
 * already loaded a profile — which is all of them.
 */
export async function tierWriteAllowed(
  required: Requirement,
  area: string,
  adultOnly = true,
): Promise<{ error: string } | null> {
  /*
   * A child inherits her guardian's tier, so she passes every tier check in
   * here — which meant these guards let her write to Protocols, Wardrobe,
   * Studio, Freedom and Ask an Expert, all five of whose pages call
   * `adultsOnly()`. Found by walking the real accounts through the guards
   * after writing them: Zaylee resolves to founder, and founder passes
   * everything.
   *
   * Which is this same bug a fifth time, in the fix for the fourth. The tier
   * question and the "is this hers to use" question are different questions,
   * and answering one does not answer the other.
   *
   * `learning` is the exception and the reason this is a parameter: the
   * learning board is a child's own page, and it is gated on tier because her
   * parent pays for it, not because she is too young for it.
   */
  const access = await getAccess()
  if (adultOnly) {
    const { adultsOnlyWrite } = await import('@/lib/kid-guard')
    const notHers = await adultsOnlyWrite(area)
    if (notHers) return notHers
  }
  if (meets(access.tier, required)) return null
  return { error: WHY[required](area) }
}

/**
 * Which actions guard which area, in one place a script can read.
 *
 * The point of listing them here rather than only in the code is that a *new*
 * write action in a gated area is the thing that will go wrong next, and it
 * will go wrong silently. `check:access` reads this map and fails when
 * anything named here has lost its guard.
 *
 * Not listed, on purpose:
 *   - `saveBodyPreferences` — its form lives on `/app/settings`, which is free
 *   - `toggleSavedResource` — the shelf it belongs to is on `/app/nutrition`,
 *     which is free to log in
 *   - `setLifeStage` — currently has no caller anywhere in the app
 */
export const GATED_ACTIONS: Record<string, { required: Requirement; area: string; adultOnly?: false }> = {
  submitExpertQuestion: { required: 'inner-circle', area: 'Ask an Expert' },

  startProtocol: { required: 'circle', area: 'Protocols' },
  endProtocol: { required: 'circle', area: 'Protocols' },
  completeProtocolDay: { required: 'circle', area: 'Protocols' },
  addBeautyProduct: { required: 'circle', area: 'Protocols' },
  removeBeautyProduct: { required: 'circle', area: 'Protocols' },
  logRoutineDone: { required: 'circle', area: 'Protocols' },
  saveSkinConcerns: { required: 'circle', area: 'Protocols' },

  addGarment: { required: 'circle', area: 'Wardrobe' },
  updateGarment: { required: 'circle', area: 'Wardrobe' },
  logWear: { required: 'circle', area: 'Wardrobe' },
  undoWear: { required: 'circle', area: 'Wardrobe' },
  saveOutfit: { required: 'circle', area: 'Wardrobe' },
  deleteOutfit: { required: 'circle', area: 'Wardrobe' },
  pinOutfit: { required: 'circle', area: 'Wardrobe' },
  saveStyleProfile: { required: 'circle', area: 'Wardrobe' },

  addStudioItem: { required: 'circle', area: 'Studio' },
  archiveStudioItem: { required: 'circle', area: 'Studio' },
  advanceStudioItem: { required: 'circle', area: 'Studio' },
  addStudioBlock: { required: 'circle', area: 'Studio' },
  removeStudioBlock: { required: 'circle', area: 'Studio' },

  upsertMoneyAccount: { required: 'circle', area: 'Freedom' },
  archiveMoneyAccount: { required: 'circle', area: 'Freedom' },
  addMoneyEntry: { required: 'circle', area: 'Freedom' },
  deleteMoneyEntry: { required: 'circle', area: 'Freedom' },

  addLearningItem: { required: 'circle', area: 'Learning boards', adultOnly: false },
  archiveLearningItem: { required: 'circle', area: 'Learning boards', adultOnly: false },
  toggleLearningItem: { required: 'circle', area: 'Learning boards', adultOnly: false },
}

/**
 * May this account work on this course?
 *
 * `enrollInCourse` asks two questions carefully — is this program turned on
 * for her, and is she paid — and then `completeCourseDay`,
 * `uncompleteCourseDay` and `saveCourseWriting` asked neither. Enrolling is
 * the door; doing the days is the action. A free account could complete every
 * day of a paid program, and a child could work through a course her mother
 * had deliberately switched off, in both cases without ever enrolling, since
 * none of the three requires an enrollment to exist.
 *
 * `saveCourseWriting` also calls `bumpStreak`, so the streak on Today counted
 * work done inside something she was not in.
 *
 * The program allow-list check is the same one `enrollInCourse` was doing
 * inline; it lives here now so there is one copy of it rather than two that
 * can drift.
 */
export async function courseWriteAllowed(slug: string): Promise<{ error: string } | null> {
  const { getSessionProfile } = await import('@/lib/data')
  const { courseAllowList } = await import('@/lib/kid')

  const me = await getSessionProfile()
  const allowed = courseAllowList(me)
  if (allowed && !allowed.includes(slug)) {
    return { error: 'That program is not turned on for you yet.' }
  }
  // Not adult-only: a child works through the courses her mother switched on,
  // and the allow-list above is what decides which. That is the whole design.
  return tierWriteAllowed('circle', 'Programs', false)
}

/**
 * The course actions that must call `courseWriteAllowed`.
 *
 * Separate from `GATED_ACTIONS` because these need the two-part check — tier
 * *and* which programs a child's parent has switched on — rather than tier
 * alone. `check:access` reads both maps.
 */
export const COURSE_ACTIONS = ['enrollInCourse', 'completeCourseDay', 'uncompleteCourseDay', 'saveCourseWriting']
