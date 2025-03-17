import { createClient } from "@supabase/supabase-js"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "@/types/supabase"

// Create a single instance of the Supabase client for server-side use
// This function now uses the createServerClient method for proper cookie handling
export function createServerSupabaseClient() {
  // Create a client that works in Server Components and API Routes
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          try {
            return cookies().get(name)?.value
          } catch (error) {
            console.error('Error getting cookie:', error)
            return undefined
          }
        },
        set(name: string, value: string, options: { path: string; maxAge?: number; domain?: string; secure?: boolean; sameSite?: 'strict' | 'lax' | 'none' }) {
          try {
            cookies().set(name, value, options)
          } catch (error) {
            console.error('Error setting cookie:', error)
          }
        },
        remove(name: string, options: { path: string; maxAge?: number; domain?: string; secure?: boolean; sameSite?: 'strict' | 'lax' | 'none' }) {
          try {
            cookies().set(name, '', { ...options, maxAge: 0 })
          } catch (error) {
            console.error('Error removing cookie:', error)
          }
        }
      }
    }
  )
}

// Client components should use the useSupabase hook from the providers context
// This ensures a single instance of the Supabase client is used across the application

