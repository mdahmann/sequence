"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"
import { useRouter, usePathname } from "next/navigation"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create a single instance of the Supabase client outside of any components
// with proper configuration for authentication
const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    flowType: 'pkce', // Use the more secure PKCE flow for authentication
    detectSessionInUrl: true,
  }
})

type SupabaseContext = {
  supabase: ReturnType<typeof createClient<Database>>;
  isAuthenticated: boolean;
}

const Context = createContext<SupabaseContext | undefined>(undefined)

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  
  useEffect(() => {
    // Don't run auth checks on 404 pages to prevent refresh loops
    if (pathname === "/not-found" || pathname === "/404") {
      return;
    }
    
    // Check authentication status when component mounts
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setIsAuthenticated(!!session)
        
        // Subscribe to auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (_event, session) => {
            console.log("Auth state changed:", _event, session ? "Authenticated" : "Not authenticated")
            
            // Log detailed user information
            if (session?.user) {
              console.log("Auth user details:", {
                userId: session.user.id,
                email: session.user.email,
                provider: session.user.app_metadata?.provider || 'unknown',
                createdAt: session.user.created_at,
                lastSignInAt: session.user.last_sign_in_at
              })
            }
            
            setIsAuthenticated(!!session)
            
            // Refresh the page after auth state changes to ensure all components update
            // Don't refresh on not-found pages
            if (pathname !== "/not-found" && pathname !== "/404") {
              router.refresh()
            }
          }
        )
        
        return () => {
          subscription.unsubscribe()
        }
      } catch (error) {
        console.error("Error checking auth in provider:", error)
      }
    }
    
    checkAuth()
  }, [router, pathname])
  
  return (
    <Context.Provider value={{ supabase, isAuthenticated }}>
      {children}
    </Context.Provider>
  )
}

export const useSupabase = () => {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error("useSupabase must be used inside SupabaseProvider")
  }
  return context
}

