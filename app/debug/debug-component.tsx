"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useSupabase } from "@/components/providers"
import { useGenerateCues } from "@/hooks/use-generate-cues"

export function DebugComponent() {
  const { supabase } = useSupabase()
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const { generateCues, isLoading: isGeneratingCues } = useGenerateCues()

  const testDebugEndpoint = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/debug", {
        method: "GET",
      })
      const data = await response.json()
      setResult(data)
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const testGenerateCues = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // First get a random pose
      const { data: poses, error: posesError } = await supabase
        .from("poses")
        .select("id, english_name")
        .limit(1)
      
      if (posesError || !poses || poses.length === 0) {
        throw new Error("Failed to fetch a pose")
      }
      
      const pose = poses[0]
      setResult({ message: `Generating cues for ${pose.english_name}...` })
      
      // Now generate cues for this pose
      const cues = await generateCues({
        poseId: pose.id,
        side: "",
        existingCues: "",
      })
      
      setResult({ 
        pose: pose.english_name, 
        cues,
        message: cues ? "Successfully generated cues" : "Failed to generate cues" 
      })
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const testPoseSelection = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Fetch a list of poses
      const { data: poses, error: posesError } = await supabase
        .from("poses")
        .select("*")
        .limit(5)
      
      if (posesError) throw posesError
      
      setResult({ 
        message: "Successfully fetched poses", 
        poses: poses?.map(p => ({ id: p.id, name: p.english_name })) 
      })
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Debug API Endpoints</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-4">
            <Button onClick={testDebugEndpoint} disabled={isLoading}>
              Test Debug Endpoint
            </Button>
            <Button onClick={testGenerateCues} disabled={isLoading || isGeneratingCues}>
              Test Generate Cues
            </Button>
            <Button onClick={testPoseSelection} disabled={isLoading}>
              Test Pose Selection
            </Button>
          </div>
          
          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-md">
              <p className="font-medium">Error:</p>
              <p>{error}</p>
            </div>
          )}
          
          {result && (
            <div className="p-4 bg-gray-50 rounded-md">
              <p className="font-medium">Result:</p>
              <pre className="mt-2 whitespace-pre-wrap text-sm">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 