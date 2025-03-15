import { useState } from "react"

interface GenerateCuesOptions {
  poseId: string
  side?: string
  existingCues?: string
}

interface GenerateCuesResult {
  cues: string | null
  isLoading: boolean
  error: string | null
  generateCues: (options: GenerateCuesOptions) => Promise<string | null>
}

export function useGenerateCues(): GenerateCuesResult {
  const [cues, setCues] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateCues = async (options: GenerateCuesOptions): Promise<string | null> => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/generate-cues", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          poseId: options.poseId,
          side: options.side || "",
          existingCues: options.existingCues || "",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate teaching cues")
      }

      const data = await response.json()
      setCues(data.cues)
      return data.cues
    } catch (err: any) {
      setError(err.message || "An error occurred while generating teaching cues")
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return {
    cues,
    isLoading,
    error,
    generateCues,
  }
} 