"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { EnhancedSlider } from "./ui-enhanced/slider"
import { LoadingSpinner } from "./ui-enhanced/loading-spinner"
import { useToast } from "@/components/ui/use-toast"
import { clientSequenceService, APIError } from "@/lib/services/client-sequence-service"
import { Sequence, SequenceParams } from "@/types/sequence"
import { cn } from "@/lib/utils"
import { useSupabase } from "@/components/providers"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Define options for each form field
const difficultyOptions = ["beginner", "intermediate", "advanced"] as const
const styleOptions = ["vinyasa", "hatha", "yin", "power", "restorative"] as const
const focusOptions = [
  "full body",
  "upper body",
  "lower body",
  "core",
  "balance",
  "flexibility",
] as const

export function EnhancedSequenceGenerator() {
  const router = useRouter()
  const { toast } = useToast()
  const { supabase, isAuthenticated } = useSupabase()
  
  // Form state
  const [duration, setDuration] = useState<number>(30)
  const [difficulty, setDifficulty] = useState<(typeof difficultyOptions)[number]>("intermediate")
  const [style, setStyle] = useState<(typeof styleOptions)[number]>("vinyasa")
  const [focus, setFocus] = useState<(typeof focusOptions)[number]>("full body")
  const [additionalNotes, setAdditionalNotes] = useState<string>("")
  
  // UI state
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [generatedSequence, setGeneratedSequence] = useState<Sequence | null>(null)
  const [tabValue, setTabValue] = useState<string>("generate")
  
  // Debug authentication status
  useEffect(() => {
    async function checkAuthDetails() {
      const { data: { session } } = await supabase.auth.getSession()
      console.log("Client Auth Status:", {
        isAuthenticated,
        userId: session?.user?.id,
        email: session?.user?.email,
        provider: session?.user?.app_metadata?.provider || "unknown"
      })
      
      // Store the session token in localStorage for API requests
      if (session?.access_token) {
        console.log("Storing auth token in localStorage, token length:", session.access_token.length);
        localStorage.setItem("supabase.auth.token", session.access_token);
      } else {
        console.log("No access token found in session");
        // Try to refresh the session if we're authenticated but no token
        if (isAuthenticated) {
          const { data } = await supabase.auth.refreshSession();
          if (data.session?.access_token) {
            console.log("Got refreshed token, storing in localStorage");
            localStorage.setItem("supabase.auth.token", data.session.access_token);
          }
        }
      }
    }
    
    checkAuthDetails()
  }, [supabase, isAuthenticated])
  
  // Handler to navigate to sequence editor
  const handleEditSequence = () => {
    if (generatedSequence) {
      router.push(`/edit/${generatedSequence.id}`)
    }
  }
  
  // Save sequence to localStorage for beta version
  const saveSequenceToLocalStorage = (sequence: Sequence) => {
    try {
      // Get existing sequences or initialize empty array
      const sequencesJson = localStorage.getItem("generatedSequences")
      const sequences = sequencesJson ? JSON.parse(sequencesJson) : []
      
      // Add new sequence or update if it already exists
      const existingIndex = sequences.findIndex((seq: Sequence) => seq.id === sequence.id)
      if (existingIndex >= 0) {
        sequences[existingIndex] = sequence
      } else {
        sequences.push(sequence)
      }
      
      // Save back to localStorage
      localStorage.setItem("generatedSequences", JSON.stringify(sequences))
    } catch (error) {
      console.error("Error saving sequence to localStorage:", error)
    }
  }
  
  // Handle sequence generation
  const handleGenerateSequence = async () => {
    try {
      // First, check if user is authenticated
      console.log("Generate sequence - Auth details:", {
        isAuthenticated: isAuthenticated,
        sessionExists: !!(await supabase.auth.getSession()).data.session,
        sessionData: (await supabase.auth.getSession()).data.session
      })
      
      if (!isAuthenticated) {
        console.log("Client-side auth check: User is not authenticated")
        toast({
          title: "Authentication Required",
          description: "Please sign in or create an account to generate sequences.",
          variant: "destructive",
        })
        return
      }
      
      console.log("Client-side auth check: User is authenticated")
      
      // Set loading state
      setIsGenerating(true)
      
      const params: SequenceParams = {
        duration,
        difficulty,
        style,
        focus,
        additionalNotes: additionalNotes.trim() || undefined,
      }
      
      console.log("Generating sequence with params:", params)
      
      // Generate sequence
      const sequence = await clientSequenceService.generateSequence(params)
      
      // Update state
      setGeneratedSequence(sequence)
      setTabValue("result")
      
      // Save to local storage for beta version
      saveSequenceToLocalStorage(sequence)
      
      // Navigate to editor
      router.push(`/edit/${sequence.id}`)
    } catch (error: any) {
      console.error("Sequence generation error:", error)
      
      if (error.status === 401) {
        console.log("Authentication error detected")
        
        // Check if we have a session but still get 401
        const { data: sessionData } = await supabase.auth.getSession() 
        if (sessionData.session) {
          console.log("Session exists but got 401 - refreshing token")
          // Try to refresh the token
          await supabase.auth.refreshSession()
          // Store updated token
          localStorage.setItem("supabase.auth.token", sessionData.session.access_token)
        }
        
        toast({
          title: "Authentication Required",
          description: "Please sign in or create an account to generate sequences.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error Generating Sequence",
          description: error.message || "An unexpected error occurred",
          variant: "destructive",
        })
      }
    } finally {
      setIsGenerating(false)
    }
  }
  
  return (
    <div className="bg-warm-white dark:bg-deep-charcoal-light rounded-lg shadow-sm overflow-hidden">
      <div className="p-6">
        <div className="space-y-6">
          {/* Duration slider */}
          <div>
            <label className="block text-sm font-medium mb-2 text-deep-charcoal dark:text-warm-white">
              Duration (minutes)
            </label>
            <EnhancedSlider
              min={5}
              max={90}
              step={5}
              value={duration}
              onChange={setDuration}
              showTicks
              tickInterval={15}
              formatValue={(value) => `${value} min`}
            />
          </div>
          
          {/* Difficulty selection */}
          <div>
            <label className="block text-sm font-medium mb-2 text-deep-charcoal dark:text-warm-white">
              Difficulty Level
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {difficultyOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setDifficulty(option)}
                  className={cn(
                    "relative border rounded-lg p-4 cursor-pointer transition-all duration-200",
                    difficulty === option
                      ? "border-vibrant-blue bg-vibrant-blue/5"
                      : "border-gray-200 dark:border-gray-700 hover:border-vibrant-blue/50"
                  )}
                >
                  <div className="font-medium">{option}</div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Style selection */}
          <div>
            <label className="block text-sm font-medium mb-2 text-deep-charcoal dark:text-warm-white">
              Yoga Style
            </label>
            <div className="flex flex-wrap gap-2">
              {styleOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setStyle(option)}
                  className={cn(
                    "px-4 py-2 rounded-full border-2 transition-colors",
                    style === option
                      ? "border-vibrant-blue bg-vibrant-blue/10 text-vibrant-blue"
                      : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          
          {/* Focus selection */}
          <div>
            <label className="block text-sm font-medium mb-2 text-deep-charcoal dark:text-warm-white">
              Area of Focus
            </label>
            <div className="flex flex-wrap gap-2">
              {focusOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFocus(option)}
                  className={cn(
                    "px-4 py-2 rounded-full border-2 transition-colors",
                    focus === option
                      ? "border-vibrant-blue bg-vibrant-blue/10 text-vibrant-blue"
                      : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          
          {/* Additional notes */}
          <div>
            <label className="block text-sm font-medium mb-2 text-deep-charcoal dark:text-warm-white">
              Additional Requirements (Optional)
            </label>
            <textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Any specific requirements or preferences..."
              className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-vibrant-blue/50 dark:bg-gray-800 dark:text-gray-100"
              rows={3}
            />
          </div>
          
          {/* Generate button */}
          <div>
            <motion.button
              onClick={handleGenerateSequence}
              disabled={isGenerating}
              className="w-full py-3 px-4 bg-vibrant-blue hover:bg-vibrant-blue/90 text-white font-medium rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-vibrant-blue/50 focus:ring-offset-2 disabled:opacity-70 transition-colors"
              whileTap={{ scale: 0.98 }}
              whileHover={{ scale: 1.02 }}
            >
              {isGenerating ? (
                <div className="flex items-center justify-center">
                  <LoadingSpinner size="small" color="white" className="mr-2" />
                  <span>Generating...</span>
                </div>
              ) : (
                "Generate Sequence"
              )}
            </motion.button>
          </div>
        </div>
      </div>
      
      {/* Results preview */}
      {generatedSequence && (
        <div className="bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-semibold text-deep-charcoal dark:text-warm-white">
                {generatedSequence.name}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                {generatedSequence.description}
              </p>
            </div>
            
            <motion.button
              onClick={handleEditSequence}
              className="px-4 py-2 bg-vibrant-blue text-white font-medium rounded-md shadow-sm hover:bg-vibrant-blue/90 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Edit Sequence
            </motion.button>
          </div>
          
          <div className="space-y-4">
            {generatedSequence.phases.map((phase) => (
              <div key={phase.id} className="bg-white dark:bg-gray-800 rounded-md shadow-sm p-4">
                <h4 className="font-medium mb-2 text-deep-charcoal dark:text-warm-white">
                  {phase.name}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  {phase.description}
                </p>
                <div className="space-y-2">
                  {phase.poses.map((pose) => (
                    <div 
                      key={pose.id}
                      className="flex items-center py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded-md"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-deep-charcoal dark:text-warm-white">
                          {pose.name}
                          {pose.side && (
                            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                              ({pose.side})
                            </span>
                          )}
                        </div>
                        {pose.sanskrit_name && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {pose.sanskrit_name}
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {Math.floor(pose.duration_seconds / 60)}:{(pose.duration_seconds % 60).toString().padStart(2, '0')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 