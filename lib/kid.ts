export interface ChildPermissions {
  circle?: boolean
  program?: string[]
}

/**
 * A child's app: her day, her learning, her food, and her — plus whatever
 * her parent has switched on: the Circle, and specific courses.
 */
export function kidAllowed(path: string, perms: ChildPermissions = {}): boolean {
  /*
   * `/app` was in this list, and the check was
   * `path === r || path.startsWith(r + '/')` — which for `/app` is
   * `path.startsWith('/app/')`, and that is every route in the app. The gate
   * returned true for `/app/circle`, `/app/money`, `/app/settings`,
   * `/app/vault`, everything. It has been open since it was written.
   *
   * `/app` is her home and has to be allowed, but only exactly — never as a
   * prefix. Everything else she may reach is named here in full.
   */
  if (path === '/app') return true

  const always = ['/app/learning', '/app/kid-food', '/app/nutrition/log', '/app/kid-me', '/app/kid-money', '/app/checkin']
  if (always.some((r) => path === r || path.startsWith(r + '/'))) return true
  if (perms.circle && (path.startsWith('/app/circle') || path.startsWith('/app/members'))) return true
  if (perms.program?.length) {
    if (path === '/app/program' || path.startsWith('/app/program?')) return true
    const m = path.match(/^\/app\/program\/([^/?]+)/)
    if (m && perms.program.includes(m[1])) return true
  }
  return false
}

/**
 * Which programs this viewer may open: null means all of them (an adult), a
 * list means only those (a child, set by her parent).
 */
export function courseAllowList(
  p: { is_child?: boolean | null; child_permissions?: { program?: string[] } | null } | null | undefined,
): string[] | null {
  if (!p?.is_child) return null
  return p.child_permissions?.program ?? []
}
