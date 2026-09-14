import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  /*
   * Tell server components which path they are rendering.
   *
   * Next.js does not hand a server component its own pathname, and the child
   * gate in `app/app/layout.tsx` needs it: a child whose parent switched the
   * Circle off should never have the Circle's server component run at all,
   * and a `useEffect` redirect on the client is far too late — by then the
   * page has rendered and its data has been sent.
   *
   * This lives here rather than in a `middleware.ts` of its own. Next 16
   * renamed middleware to proxy, and having both files is a hard build error
   * — which is exactly how the first attempt at this failed. Set before
   * either `NextResponse.next({ request })` below, so both the plain and the
   * cookie-refreshed response carry it.
   */
  request.headers.set('x-pathname', request.nextUrl.pathname)

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: { secure: process.env.NODE_ENV === 'production' },
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // Protect the member app and admin
  if ((path.startsWith('/app') || path.startsWith('/admin') || path.startsWith('/onboarding')) && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // Keep logged-in users out of auth pages
  if ((path.startsWith('/auth/login') || path === '/kid') && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/app'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
