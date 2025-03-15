import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Routes that require authentication
const protectedRoutes = ['/account', '/flows']

// Routes that should redirect to a different page if already signed in
const authRoutes = ['/login', '/signup']

export async function middleware(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
      }
    }
  )

  // Get session from cookies
  const { data: { session } } = await supabase.auth.getSession()
  const isAuthenticated = !!session
  
  const { pathname } = request.nextUrl
  
  // Check if the path is in the protected routes
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  )
  
  // Check if the path is an auth route (login/signup)
  const isAuthRoute = authRoutes.some(route => pathname === route)
  
  // If the route is protected and the user is not authenticated, redirect to login
  if (isProtectedRoute && !isAuthenticated) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }
  
  // If the user is authenticated and tries to access login/signup, redirect to account
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/account', request.url))
  }
  
  return NextResponse.next()
}

// Only run middleware on matching routes
export const config = {
  matcher: [
    '/account/:path*',
    '/flows/:path*',
    '/login',
    '/signup',
  ],
} 