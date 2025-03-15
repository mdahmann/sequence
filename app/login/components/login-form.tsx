"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Loader2, Mail } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { useSupabase } from "@/components/providers"

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") || "/"

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { supabase } = useSupabase()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState<string | null>(null)

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        throw error
      }

      // If successful, refresh the page to update auth state in the navbar
      window.location.href = redirect
    } catch (error: any) {
      console.error("Login error:", error)
      toast({
        title: "Error",
        description: error.message || "An error occurred during sign in",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleMagicLinkLogin = async () => {
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

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}`,
        },
      })

      if (error) {
        setError(error.message)
        throw error
      }

      setMessage("Check your email for the login link")
    } catch (error: any) {
      console.error("Magic link error:", error)
      toast({
        title: "Error",
        description: error.message || "An error occurred sending the magic link",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-[500px] mx-auto">
      <CardContent className="pt-6">
        {message && <div className="bg-primary/10 text-primary p-3 rounded-md mb-4">{message}</div>}
        {error && <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-4">{error}</div>}

        <form onSubmit={handleEmailLogin} className="space-y-4">
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

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Button variant="link" size="sm" className="p-0 h-auto" asChild>
                <a href="/forgot-password">Forgot password?</a>
              </Button>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-muted"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <Button type="button" variant="outline" className="w-full" onClick={handleMagicLinkLogin} disabled={loading}>
          <Mail className="mr-2 h-4 w-4" />
          Sign in with Magic Link
        </Button>
      </CardContent>

      <CardFooter className="flex flex-col space-y-4 border-t pt-6">
        <div className="text-center text-sm">
          Don't have an account?{" "}
          <Button variant="link" className="p-0 h-auto" asChild>
            <a href="/signup">Sign up</a>
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

