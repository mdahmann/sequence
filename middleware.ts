import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Only redirect login/signup pages if already signed in
// Let individual pages handle their own auth checks
const authRoutes = ['/login', '/signup']

export async function middleware(request: NextRequest) {
  // Check for all paths that should be completely bypassed
  const url = request.nextUrl.pathname
  
  // Skip middleware for 404 pages or static resources
  if (url.startsWith('/_next') || 
      url === '/404' || 
      url === '/not-found' ||
      url === '/static-404' ||
      url.includes('favicon')) {
    return NextResponse.next()
  }
  
  // We'll only keep the middleware for redirecting from login/signup pages when already logged in
  // Individual pages will handle their own authentication checks
  return NextResponse.next()
}

// Only run middleware on a subset of routes
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|static-404).*)',
  ],
} 