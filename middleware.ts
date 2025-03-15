import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Only redirect login/signup pages if already signed in
// Let individual pages handle their own auth checks
const authRoutes = ['/login', '/signup']

export async function middleware(request: NextRequest) {
  // We'll only keep the middleware for redirecting from login/signup pages when already logged in
  // Individual pages will handle their own authentication checks

  return NextResponse.next()
}

// Only run middleware on a subset of routes
export const config = {
  matcher: [
    '/login',
    '/signup',
  ],
} 