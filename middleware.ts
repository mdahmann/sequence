import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Routes that require authentication
const protectedRoutes = ['/account', '/flows']

// Routes that should redirect to a different page if already signed in
const authRoutes = ['/login', '/signup']

// Routes that should be exempted from middleware (callback routes, etc.)
const exemptRoutes = ['/auth/callback']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip middleware for exempt routes
  const isExemptRoute = exemptRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  )
  
  if (isExemptRoute) {
    return NextResponse.next()
  }
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
          flowType: 'pkce',
        }
      }
    )

    // Get session from cookies
    const { data: { session } } = await supabase.auth.getSession()
    const isAuthenticated = !!session
    
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
  } catch (error) {
    console.error('Middleware error:', error)
    // If there's an error in authentication, still allow the user to continue
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
    '/auth/callback',
  ],
} 