import { NextResponse, type NextRequest } from 'next/server'

/**
 * Tell server components which path they are rendering.
 *
 * Next.js does not give a server component its own pathname, and the child
 * gate in `app/app/layout.tsx` needs it: a child whose parent switched the
 * Circle off should never have the Circle's server component run at all, and
 * a `useEffect` redirect on the client is far too late — by then the page has
 * rendered and its data has been sent.
 *
 * This does nothing else. It touches no cookies, refreshes no session and
 * makes no decisions; it forwards the request unchanged with one extra header
 * so the layout can read it. Adding anything that redirects or rewrites here
 * would put it in front of every request in the app, which is a much bigger
 * thing than this needs to be.
 */
export function middleware(request: NextRequest) {
  const headers = new Headers(request.headers)
  headers.set('x-pathname', request.nextUrl.pathname)
  return NextResponse.next({ request: { headers } })
}

export const config = {
  /*
   * Only the signed-in app. Static files, images and the API have no use for
   * the header, and keeping them out means this never runs on an asset.
   */
  matcher: ['/app/:path*'],
}
