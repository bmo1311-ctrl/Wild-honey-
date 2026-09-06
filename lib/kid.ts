/** What a child's app is: her day, her learning, her food, and her. Nothing social, nothing adult. */
export const KID_ROUTES = ['/app', '/app/learning', '/app/nutrition/log', '/app/kid-me']
export function kidAllowed(path: string): boolean {
  return KID_ROUTES.some((r) => path === r || (r !== '/app' && path.startsWith(r + '/'))) || path.startsWith('/app/nutrition/log')
}
