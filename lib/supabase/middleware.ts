import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options',  'nosniff')
  response.headers.set('X-Frame-Options',         'DENY')
  response.headers.set('X-XSS-Protection',        '1; mode=block')
  response.headers.set('Referrer-Policy',         'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy',      'camera=(), microphone=(), geolocation=()')
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  return response
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const protectedRoutes = [
    '/dashboard', '/analyze-ticket', '/insights', '/settings',
    '/integrations', '/saved-replies', '/tickets', '/team', '/admin',
    '/knowledge-base', '/frustration', '/performance', '/usage', '/roi',
  ]
  const isProtected = protectedRoutes.some(r =>
    request.nextUrl.pathname.startsWith(r)
  )

  // Redirect unauthenticated users away from protected routes
  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return applySecurityHeaders(NextResponse.redirect(url))
  }

  // Redirect logged-in users away from auth pages AND landing page
  if (user && (
    request.nextUrl.pathname === '/' ||
    request.nextUrl.pathname.startsWith('/auth/login') ||
    request.nextUrl.pathname.startsWith('/auth/signup')
  )) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return applySecurityHeaders(NextResponse.redirect(url))
  }

  return applySecurityHeaders(response)
}