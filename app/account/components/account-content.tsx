"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, LogOut, Lock } from "lucide-react"
import { useSupabase } from "@/components/providers"
import { toast } from "@/components/ui/use-toast"
import type { User } from '@supabase/supabase-js'

export function AccountContent() {
  const router = useRouter()
  const { supabase } = useSupabase()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [flowCount, setFlowCount] = useState(0)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  useEffect(() => {
    // Fetch the user and flow count
    const getUser = async () => {
      setIsLoading(true)
      
      try {
        console.log("AccountContent: Checking auth state")
        // Get user session
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session || !session.user) {
          console.log("AccountContent: No session found, redirecting to login")
          router.push('/login?redirect=/account')
          return
        }
        
        console.log("AccountContent: User authenticated:", session.user.email)
        setUser(session.user)
        
        // Get count of user's flows
        await getFlowCount(session.user.id)
      } catch (error) {
        console.error("Error fetching user data:", error)
        toast({
          title: "Error",
          description: "Failed to load account information",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    getUser()
  }, [supabase, router])
  
  const getFlowCount = async (userId: string) => {
    try {
      const { count, error } = await supabase
        .from("sequences")
        .select("*", { count: 'exact' })
        .eq("user_id", userId)
      
      if (!error) {
        setFlowCount(count || 0)
      }
    } catch (error) {
      console.error("Error fetching flow count:", error)
    }
  }
  
  const handleSignOut = async () => {
    setIsLoading(true)
    
    try {
      console.log("AccountContent: Signing out")
      await supabase.auth.signOut()
      // Force a full page reload to clear all auth state
      window.location.href = '/login'
    } catch (error) {
      console.error("Error signing out:", error)
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation
    if (!currentPassword) {
      toast({
        title: "Error",
        description: "Please enter your current password",
        variant: "destructive",
      })
      return
    }
    
    if (!newPassword) {
      toast({
        title: "Error",
        description: "Please enter a new password",
        variant: "destructive",
      })
      return
    }
    
    if (newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      })
      return
    }
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords don't match",
        variant: "destructive",
      })
      return
    }
    
    setIsChangingPassword(true)
    
    try {
      // First we need to sign in with the current password to verify it
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: currentPassword,
      })
      
      if (signInError) {
        throw new Error("Current password is incorrect")
      }
      
      // Now update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })
      
      if (updateError) {
        throw new Error(updateError.message)
      }
      
      // Clear the form
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      
      toast({
        title: "Success",
        description: "Your password has been updated",
      })
    } catch (error) {
      console.error("Error changing password:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to change password",
        variant: "destructive",
      })
    } finally {
      setIsChangingPassword(false)
    }
  }
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center my-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }
  
  if (!user) {
    return (
      <div className="text-center my-12">
        <p className="text-muted-foreground">Please log in to view your account settings.</p>
        <Button className="mt-4" onClick={() => router.push('/login')}>
          Sign In
        </Button>
      </div>
    )
  }
  
  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase()
  }
  
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">{getInitials(user.email || '')}</AvatarFallback>
            </Avatar>
            <div>
              <div className="text-xl font-medium">{user.email}</div>
              <div className="text-sm text-muted-foreground">
                Member since {new Date(user.created_at || Date.now()).toLocaleDateString()}
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant="outline" className="px-3 py-1">
              {flowCount} Flows Created
            </Badge>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </CardFooter>
      </Card>

      {/* Password Change Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lock className="mr-2 h-5 w-5" />
            Change Password
          </CardTitle>
        </CardHeader>
        <form onSubmit={handlePasswordChange}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={isChangingPassword}
                placeholder="Enter your current password"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isChangingPassword}
                placeholder="Enter a new password"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isChangingPassword}
                placeholder="Confirm your new password"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isChangingPassword}>
              {isChangingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Password"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
} 