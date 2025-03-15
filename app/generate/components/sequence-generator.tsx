"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2, Sparkles, Info, AlertCircle } from "lucide-react"
import { useSupabase } from "@/components/providers"
import { generateSequence } from "../actions"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Link from "next/link"

const formSchema = z.object({
  duration: z.string().min(1, {
    message: "Please select a duration.",
  }),
  difficulty: z.string().min(1, {
    message: "Please select a difficulty level.",
  }),
  style: z.string().min(1, {
    message: "Please select a yoga style.",
  }),
  focus: z.string().min(1, {
    message: "Please select a focus area.",
  }),
  additionalNotes: z.string().optional(),
})

export function SequenceGenerator() {
  const router = useRouter()
  const { supabase } = useSupabase()
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      setIsCheckingAuth(true)
      console.log("SequenceGenerator: Checking auth state")
      
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user?.id) {
          console.log("SequenceGenerator: User authenticated:", session.user.email)
          setUserId(session.user.id)
          setIsAuthenticated(true)
        } else {
          console.log("SequenceGenerator: No authenticated user found")
          // If not authenticated, still allow using the app with a default ID
          setUserId("00000000-0000-0000-0000-000000000000")
          setIsAuthenticated(false)
        }
      } catch (error) {
        console.error("SequenceGenerator: Error checking auth:", error)
        setUserId("00000000-0000-0000-0000-000000000000")
        setIsAuthenticated(false)
      } finally {
        setIsCheckingAuth(false)
      }
    }
    
    checkAuth()
  }, [supabase])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      duration: "",
      difficulty: "",
      style: "",
      focus: "",
      additionalNotes: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsGenerating(true)
      setError(null)
      
      console.log("SequenceGenerator: Generating sequence with values:", values)

      // Use the actual user ID if available, otherwise use the default
      const currentUserId = userId || "00000000-0000-0000-0000-000000000000"
      
      console.log("SequenceGenerator: Using user ID:", currentUserId)
      
      // Generate sequence using server action
      const result = await generateSequence({
        userId: currentUserId,
        duration: Number.parseInt(values.duration),
        difficulty: values.difficulty,
        style: values.style,
        focusArea: values.focus,
        additionalNotes: values.additionalNotes || "",
      })

      if (result.error) {
        console.error("SequenceGenerator: Error generating sequence:", result.error)
        setError(result.error)
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      console.log("SequenceGenerator: Sequence generated successfully:", result.sequence?.id)
      
      // If user is not authenticated, show a message encouraging them to sign up
      if (!isAuthenticated) {
        toast({
          title: "Sequence generated!",
          description: "Sign up to save this sequence and access it later.",
        })
      }

      // Redirect to the newly created sequence
      if (result.sequence && result.sequence.id) {
        router.push(`/flows/${result.sequence.id}`)
      } else {
        setError("Failed to create sequence - no sequence ID returned.")
        toast({
          title: "Error",
          description: "Failed to create sequence - no sequence ID returned.",
          variant: "destructive",
        })
      }
    } catch (err: any) {
      console.error("SequenceGenerator: Unhandled error:", err)
      setError(err.message || "An unexpected error occurred")
      toast({
        title: "Error",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // Add a login prompt for unauthenticated users
  const renderAuthPrompt = () => {
    if (isAuthenticated) return null
    
    return (
      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertTitle>Not signed in</AlertTitle>
        <AlertDescription>
          You can generate sequences without an account, but they won't be saved.{" "}
          <Link href="/signup" className="font-medium underline underline-offset-4">
            Sign up
          </Link>{" "}
          or{" "}
          <Link href="/login" className="font-medium underline underline-offset-4">
            log in
          </Link>{" "}
          to save your sequences.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardContent className="pt-6">
        {isCheckingAuth ? (
          <div className="flex justify-center items-center p-4">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span>Checking authentication...</span>
          </div>
        ) : renderAuthPrompt()}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class Duration</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select class duration" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">60 minutes</SelectItem>
                      <SelectItem value="75">75 minutes</SelectItem>
                      <SelectItem value="90">90 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>How long would you like your yoga class to be?</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="difficulty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Difficulty Level</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select difficulty level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>Choose the appropriate difficulty level for your practice.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="style"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Yoga Style</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select yoga style" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="vinyasa">Vinyasa</SelectItem>
                      <SelectItem value="hatha">Hatha</SelectItem>
                      <SelectItem value="yin">Yin</SelectItem>
                      <SelectItem value="restorative">Restorative</SelectItem>
                      <SelectItem value="power">Power</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>What style of yoga would you like to practice?</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="focus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Focus Area or Peak Pose</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select focus area" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="hip_openers">Hip Openers</SelectItem>
                      <SelectItem value="backbends">Backbends</SelectItem>
                      <SelectItem value="twists">Twists</SelectItem>
                      <SelectItem value="forward_bends">Forward Bends</SelectItem>
                      <SelectItem value="arm_balances">Arm Balances</SelectItem>
                      <SelectItem value="inversions">Inversions</SelectItem>
                      <SelectItem value="core_strength">Core Strength</SelectItem>
                      <SelectItem value="balance">Balance</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>What would you like to focus on in your practice?</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="additionalNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any specific requests or considerations for your sequence..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Add any specific requests or considerations for your sequence.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Sequence...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Sequence
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

