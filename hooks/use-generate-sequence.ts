import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/providers"

interface GenerateSequenceOptions {
  duration: number
  difficulty: string
  style: string
  focusArea: string
  additionalNotes?: string
}

interface GenerateSequenceResult {
  isGenerating: boolean
  error: string | null
  generateSequence: (options: GenerateSequenceOptions) => Promise<void>
}

export function useGenerateSequence(): GenerateSequenceResult {
  const router = useRouter()
  const { supabase } = useSupabase()
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateSequence = async (options: GenerateSequenceOptions): Promise<void> => {
    try {
      setIsGenerating(true)
      setError(null)

      // TEMPORARILY BYPASSING AUTHENTICATION
      // Use a default userId for now - this will be removed later when auth is re-enabled
      const defaultUserId = "00000000-0000-0000-0000-000000000000"; // Default placeholder user ID
      
      // Call the API endpoint to generate the sequence
      const response = await fetch("/api/generate-sequence", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: defaultUserId, // Using default user ID
          duration: options.duration,
          difficulty: options.difficulty,
          style: options.style,
          focusArea: options.focusArea,
          additionalNotes: options.additionalNotes || "",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate sequence")
      }

      const data = await response.json()
      
      // Redirect to the newly created sequence
      router.push(`/flows/${data.sequence.id}`)
    } catch (err: any) {
      setError(err.message || "An error occurred while generating the sequence")
    } finally {
      setIsGenerating(false)
    }
  }

  return {
    isGenerating,
    error,
    generateSequence,
  }
} 