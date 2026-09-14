/**
 * Where a piece of reported content actually lives.
 *
 * This map used to sit privately in `app/actions.ts`, where only the removal
 * path could see it. The admin screen needs the same map to *show* the thing
 * before it is removed, and two copies of a table lookup is exactly the shape
 * of bug this codebase keeps producing — one value computed two ways.
 *
 * Every one of these tables stores the body in `text` and the author in
 * `user_id`, which is what lets the preview below be one query per type
 * rather than six special cases.
 */
export const CONTENT_TABLE: Record<string, string> = {
  journal_entry: 'journal_entries',
  community_post: 'community_posts',
  community_comment: 'community_comments',
  group_post: 'group_posts',
  group_post_comment: 'group_post_comments',
  circle_comment: 'comments',
}
