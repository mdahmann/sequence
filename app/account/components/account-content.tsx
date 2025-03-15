"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Loader2, LogOut } from "lucide-react"
import { useSupabase } from "@/components/providers"
import { toast } from "@/components/ui/use-toast"

export function AccountContent() {
  const router = useRouter()
  const { supabase } = useSupabase()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [flowCount, setFlowCount] = useState(0)

  useEffect(() => {
    const getUser = async () => {
      setIsLoading(true)
      
      try {
        // Get user session
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session || !session.user) {
          router.push('/login')
          return
        }
        
        setUser(session.user)
        
        // Get count of user's flows
        if (session.user.id) {
          const { count, error } = await supabase
            .from("sequences")
            .select("*", { count: 'exact' })
            .eq("user_id", session.user.id)
          
          if (!error) {
            setFlowCount(count || 0)
          }
        }
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
  
  const handleSignOut = async () => {
    setIsLoading(true)
    
    try {
      await supabase.auth.signOut()
      router.push('/login')
      router.refresh()
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
              <AvatarFallback className="text-lg">{getInitials(user.email)}</AvatarFallback>
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
    </div>
  )
} 