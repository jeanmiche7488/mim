import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // Routes qui nécessitent une authentification
  const protectedRoutes = ['/', '/dashboard', '/stores', '/stocks', '/dispatch', '/parameters']
  const isProtectedRoute = protectedRoutes.some(route => request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(route + '/'))

  // Si l'utilisateur n'est pas connecté et essaie d'accéder à une route protégée
  if (!session && isProtectedRoute) {
    const redirectUrl = new URL('/auth', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Si l'utilisateur est connecté et essaie d'accéder à la page de connexion
  if (session && request.nextUrl.pathname === '/auth') {
    const redirectUrl = new URL('/', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth/callback (callback de Supabase)
     */
    '/((?!_next/static|_next/image|favicon.ico|auth/callback).*)',
  ],
} 