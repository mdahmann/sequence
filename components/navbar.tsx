"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import HandDrawnSpiral from "@/components/hand-drawn-spiral"
import { useSupabase } from "@/components/providers"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { User } from "lucide-react"

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { supabase, isAuthenticated } = useSupabase()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for the current session when the component mounts
    const checkSession = async () => {
      try {
        // Skip auth check for 404 page to prevent refresh loops
        if (pathname === "/not-found" || pathname === "/404") {
          setIsLoading(false)
          return () => {}
        }
        
        setIsLoading(true)
        const { data: { session } } = await supabase.auth.getSession()
        console.log("Navbar auth state:", session ? "Authenticated" : "Not authenticated")
        setUser(session?.user || null)
        
        // Set up a listener for auth state changes
        const { data: { subscription } } = await supabase.auth.onAuthStateChange(
          (event, session) => {
            console.log("Navbar auth state changed:", event, session ? "Authenticated" : "Not authenticated")
            setUser(session?.user || null)
          }
        )
        
        return () => {
          subscription.unsubscribe()
        }
      } catch (error) {
        console.error("Error checking auth in navbar:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    checkSession()
  }, [supabase, pathname])

  const handleSignOut = async () => {
    try {
      setIsLoading(true)
      // Add a console log to track sign out
      console.log("Signing out user...")
      
      // First clear any local state
      setUser(null)
      
      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error("Error during sign out:", error)
        // Still redirect even if there's an error
      }
      
      // Force page reload to clear all auth state
      console.log("Sign out complete, redirecting...")
      
      // Small delay to ensure state is updated before redirect
      setTimeout(() => {
        // Force a hard reload to clear all client state
        window.location.href = '/'
      }, 100)
    } catch (error) {
      console.error("Error signing out:", error)
      // Still redirect on error
      window.location.href = '/'
    } finally {
      setIsLoading(false)
    }
  }

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Generate", path: "/generate" },
    { name: "Pose Library", path: "/pose-library" },
    { name: "Flows", path: "/flows" },
  ]

  return (
    <header className="border-b border-muted bg-[url('/images/paper-bg.jpg')] bg-repeat">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link href="/" className="flex items-center space-x-2">
            <HandDrawnSpiral width={32} height={32} color="hsl(var(--primary))" strokeWidth={1.5} />
            <span className="text-xl font-sans font-medium">Sequence</span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center space-x-6">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`py-2 font-sans ${
                pathname === item.path
                  ? "text-primary border-b-2 border-primary"
                  : "text-foreground hover:text-primary"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center space-x-2">
          {isLoading ? (
            <div className="w-20 h-10 animate-pulse bg-muted rounded"></div>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="mr-2">
                  <User className="h-4 w-4 mr-2" />
                  Account
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="text-sm">
                  {user.email}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/flows">My Flows</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/account">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="outline" asChild className="mr-2">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

