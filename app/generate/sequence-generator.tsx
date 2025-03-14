"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2, Sparkles } from "lucide-react"
import { useSupabase } from "@/components/providers"
import { generateSequence } from "@/app/generate/actions"

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

      // Check if user is authenticated
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        // Redirect to login if not authenticated
        router.push("/login?redirect=/generate")
        return
      }

      // Generate sequence using server action
      const sequence = await generateSequence({
        userId: session.user.id,
        duration: Number.parseInt(values.duration),
        difficulty: values.difficulty,
        style: values.style,
        focusArea: values.focus,
        additionalNotes: values.additionalNotes || "",
      })

      // Redirect to the newly created sequence
      router.push(`/flows/${sequence.id}`)
    } catch (error) {
      console.error("Error generating sequence:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardContent className="pt-6">
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

