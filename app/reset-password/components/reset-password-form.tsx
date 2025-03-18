"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { useSupabase } from "@/components/providers"

export function ResetPasswordForm() {
  const router = useRouter()
  const { supabase } = useSupabase()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [authenticated, setAuthenticated] = useState(false)

  // Check if the user is authenticated with a recovery token
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        // Check if we have a user session
        if (session?.user) {
          setAuthenticated(true)
        } else {
          setError("Invalid or expired password reset link. Please request a new one.")
        }
      } catch (error) {
        console.error("Authentication check failed:", error)
        setError("Something went wrong. Please try again.")
      } finally {
        setInitializing(false)
      }
    }
    
    checkAuth()
  }, [supabase.auth])

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation
    if (!password) {
      toast({
        title: "Error",
        description: "Please enter a new password",
        variant: "destructive",
      })
      return
    }
    
    if (password.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      })
      return
    }
    
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords don't match",
        variant: "destructive",
      })
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      })
      
      if (error) {
        throw error
      }
      
      toast({
        title: "Success",
        description: "Your password has been updated",
      })
      
      // Redirect to login after a short delay
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (error: any) {
      console.error("Password reset error:", error)
      setError(error.message || "Failed to reset password")
      toast({
        title: "Error",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (initializing) {
    return (
      <Card className="w-[500px] max-w-full mx-auto sm:w-[500px]">
        <CardContent className="pt-6 flex justify-center items-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (!authenticated) {
    return (
      <Card className="w-[500px] max-w-full mx-auto sm:w-[500px]">
        <CardContent className="pt-6">
          <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-4">
            {error || "Invalid or expired link. Please request a new password reset."}
          </div>
          <Button
            className="w-full"
            onClick={() => router.push('/forgot-password')}
          >
            Request New Reset Link
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-[500px] max-w-full mx-auto sm:w-[500px]">
      <CardContent className="pt-6">
        {error && <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-4">{error}</div>}

        <form onSubmit={handlePasswordReset} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating Password...
              </>
            ) : (
              "Update Password"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
} 