import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { SerializeOptions } from 'cookie'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Next.js Edge Runtime exposes immutable request cookies, so we only set cookies on the response.
          // Ensure cookies are set for the root path so they apply to all app routes.
          const cookieOptions = (options?: SerializeOptions): SerializeOptions => ({
            ...options,
            path: '/',
            // Disable secure cookies in development (localhost) so they are sent over HTTP.
            secure: process.env.NODE_ENV === 'production' ? options?.secure : false,
          })

          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, cookieOptions(options))
          )
        },
      },
    }
  )

  // Refresh session — do NOT write logic between createServerClient and getUser
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Protect app routes
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup')
  const isPublicPage = isAuthPage || pathname === '/' || pathname.startsWith('/api/auth') || pathname.startsWith('/auth/callback') || pathname.startsWith('/onboarding')

  if (!user && !isPublicPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    const response = NextResponse.redirect(url)
    // IMPORTANT: Copy cookies from the refreshed session response
    supabaseResponse.cookies.getAll().forEach(cookie => {
      response.cookies.set(cookie.name, cookie.value)
    })
    return response
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    const response = NextResponse.redirect(url)
    // IMPORTANT: Copy cookies from the refreshed session response
    supabaseResponse.cookies.getAll().forEach(cookie => {
      response.cookies.set(cookie.name, cookie.value)
    })
    return response
  }

  return supabaseResponse
}
