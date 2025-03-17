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
import { PoseSelectionModal } from "./pose-selection-modal"
import { Plus } from "lucide-react"

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
  const [duration, setDuration] = useState<number>(15)
  const [difficulty, setDifficulty] = useState<(typeof difficultyOptions)[number]>("beginner")
  const [style, setStyle] = useState<(typeof styleOptions)[number]>("vinyasa")
  const [focus, setFocus] = useState<(typeof focusOptions)[number]>("full body")
  const [additionalNotes, setAdditionalNotes] = useState<string>("")
  const [peakPose, setPeakPose] = useState<{id: string, name: string, sanskrit_name?: string} | null>(null)
  const [isPoseModalOpen, setIsPoseModalOpen] = useState(false)
  
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
  
  // Function to sanitize additional requirements text
  const sanitizeRequirements = (input: string): string => {
    // Remove any HTML tags
    const withoutHtml = input.replace(/<[^>]*>/g, '')
    
    // Trim excess whitespace
    return withoutHtml.replace(/\s+/g, ' ').trim()
  }
  
  // Handle pose selection
  const handlePoseSelect = (pose: any) => {
    setPeakPose({
      id: pose.id,
      name: pose.name || pose.english_name,
      sanskrit_name: pose.sanskrit_name
    })
    setIsPoseModalOpen(false)
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
        additionalNotes: sanitizeRequirements(additionalNotes) || undefined,
        peakPose: peakPose || undefined,
      }
      
      console.log("Generating sequence with params:", params)
      
      // Generate sequence
      const sequence = await clientSequenceService.generateSequence(params)
      
      // Update state
      setGeneratedSequence(sequence)
      
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
  
  // Reset form to default values
  const handleResetForm = () => {
    setDuration(15)
    setDifficulty("beginner")
    setStyle("vinyasa")
    setFocus("full body")
    setAdditionalNotes("")
    setPeakPose(null)
  }
  
  return (
    <div className="bg-warm-white dark:bg-deep-charcoal-light rounded-lg shadow-sm overflow-hidden"
      style={{
        backgroundImage: 'url("/images/paper-bg.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="p-6 bg-white/90 dark:bg-deep-charcoal-light/95">
        <div className="space-y-6">
          {/* Duration slider */}
          <div>
            {/* <label className="block text-sm font-medium mb-2 text-deep-charcoal dark:text-warm-white">
              Duration (minutes)
            </label> */}
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
          
          {/* Peak Pose selection */}
          <div>
            <label className="block text-sm font-medium mb-2 text-deep-charcoal dark:text-warm-white">
              Peak Pose (Optional)
            </label>
            {peakPose ? (
              <div className="flex items-center justify-between border border-gray-200 dark:border-gray-700 rounded-md p-3">
                <div>
                  <div className="font-medium">{peakPose.name}</div>
                  {peakPose.sanskrit_name && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 italic">
                      {peakPose.sanskrit_name}
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsPoseModalOpen(true)}
                  >
                    Change
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setPeakPose(null)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full justify-start text-gray-600 dark:text-gray-300 border-dashed"
                onClick={() => setIsPoseModalOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Select a peak pose
              </Button>
            )}
            <p className="text-xs text-gray-500 mt-1">
              The sequence will build towards this pose as the highlight
            </p>
          </div>
          
          {/* Additional notes */}
          <div>
            <label className="block text-sm font-medium mb-2 text-deep-charcoal dark:text-warm-white">
              Additional Requirements (Optional)
            </label>
            <textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="E.g., 'Include shoulder openers', 'Focus on hip mobility', 'Avoid inversions'"
              className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-vibrant-blue/50 dark:bg-gray-800 dark:text-gray-100"
              rows={3}
              maxLength={250}
            />
            <p className="text-xs text-gray-500 mt-1">
              {250 - (additionalNotes?.length || 0)} characters remaining
            </p>
          </div>
          
          {/* Generate button */}
          <div className="flex items-center gap-3">
            <motion.button
              onClick={handleResetForm}
              className="py-3 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-deep-charcoal dark:text-warm-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400/50 focus:ring-offset-2 transition-colors"
              whileTap={{ scale: 0.98 }}
              whileHover={{ scale: 1.02 }}
            >
              Clear Filters
            </motion.button>
            
            <motion.button
              onClick={handleGenerateSequence}
              disabled={isGenerating}
              className="flex-1 py-3 px-4 bg-vibrant-blue hover:bg-vibrant-blue/90 text-white font-medium rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-vibrant-blue/50 focus:ring-offset-2 disabled:opacity-70 transition-colors"
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
      
      {/* Pose selection modal */}
      <PoseSelectionModal
        isOpen={isPoseModalOpen}
        onClose={() => setIsPoseModalOpen(false)}
        onPoseSelect={handlePoseSelect}
        title="Select a Peak Pose"
      />
    </div>
  )
} 