"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Loader2, ArrowLeft } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { useSupabase } from "@/components/providers"

export function ForgotPasswordForm() {
  const router = useRouter()
  const { supabase } = useSupabase()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      })
      return
    }
    
    setLoading(true)
    setError(null)
    setMessage(null)
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      
      if (error) {
        throw error
      }
      
      setMessage("Password reset instructions sent to your email")
    } catch (error: any) {
      console.error("Password reset error:", error)
      setError(error.message || "Failed to send reset instructions")
      toast({
        title: "Error",
        description: error.message || "Failed to send reset instructions",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-[500px] max-w-full mx-auto sm:w-[500px]">
      <CardContent className="pt-6">
        {message && <div className="bg-primary/10 text-primary p-3 rounded-md mb-4">{message}</div>}
        {error && <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-4">{error}</div>}

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending instructions...
              </>
            ) : (
              "Send Reset Instructions"
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col space-y-4 border-t pt-6">
        <div className="text-center text-sm">
          <Button 
            variant="link" 
            className="p-0 h-auto flex items-center" 
            onClick={() => router.push('/login')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sign In
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
} 