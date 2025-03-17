"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { EnhancedSlider } from "./ui-enhanced/slider"
import { LoadingSpinner } from "./ui-enhanced/loading-spinner"
import { useToast } from "./ui-enhanced/toast-provider"
import { clientSequenceService, APIError } from "@/lib/services/client-sequence-service"
import { Sequence, SequenceParams } from "@/types/sequence"
import { cn } from "@/lib/utils"
import { useSupabase } from "@/components/providers"

// Define options for each form field
const difficultyOptions = [
  { value: "beginner", label: "Beginner", description: "Gentle practice suitable for beginners with basic poses" },
  { value: "intermediate", label: "Intermediate", description: "Moderate intensity with some challenging poses" },
  { value: "advanced", label: "Advanced", description: "Challenging practice with complex poses and sequences" },
]

const styleOptions = [
  { value: "vinyasa", label: "Vinyasa Flow" },
  { value: "hatha", label: "Hatha" },
  { value: "yin", label: "Yin" },
  { value: "power", label: "Power" },
  { value: "restorative", label: "Restorative" },
]

const focusOptions = [
  { value: "full body", label: "Full Body" },
  { value: "upper body", label: "Upper Body" },
  { value: "lower body", label: "Lower Body" },
  { value: "core", label: "Core" },
  { value: "balance", label: "Balance" },
  { value: "flexibility", label: "Flexibility" },
]

export function EnhancedSequenceGenerator() {
  const router = useRouter()
  
  // Form state
  const [duration, setDuration] = useState(30)
  const [difficulty, setDifficulty] = useState<string>("intermediate")
  const [style, setStyle] = useState<string>("vinyasa")
  const [focus, setFocus] = useState<string>("full body")
  const [additionalNotes, setAdditionalNotes] = useState("")
  
  // UI state
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedSequence, setGeneratedSequence] = useState<Sequence | null>(null)
  
  // Use toast notification system
  const { showToast } = useToast()
  
  // Use Supabase
  const { supabase, isAuthenticated } = useSupabase()
  
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
  
  // Generate sequence based on form inputs
  const handleGenerateSequence = async () => {
    setIsGenerating(true)
    setGeneratedSequence(null)
    
    try {
      // First check if user is already logged in using the useSupabase hook
      // This is a client-side check before making the API call
      if (!isAuthenticated) {
        console.log("Client-side auth check: User not authenticated");
        showToast(
          "Please sign in or create an account to generate sequences",
          "auth",
          12000, // Show for longer (12 seconds)
          "center", // Display in center of screen
          [
            {
              label: "Sign In",
              onClick: () => router.push("/login")
            },
            {
              label: "Sign Up",
              onClick: () => router.push("/signup")
            }
          ]
        );
        setIsGenerating(false);
        return;
      }
      
      console.log("Client-side auth check: User is authenticated");
      
      const params: SequenceParams = {
        duration,
        difficulty: difficulty as "beginner" | "intermediate" | "advanced",
        style: style as "vinyasa" | "hatha" | "yin" | "power" | "restorative",
        focus: focus as "full body" | "upper body" | "lower body" | "core" | "balance" | "flexibility",
        additionalNotes: additionalNotes || undefined,
      }
      
      console.log("Generating sequence with params:", params);
      const sequence = await clientSequenceService.generateSequence(params)
      
      // Save the sequence to localStorage for the beta version
      saveSequenceToLocalStorage(sequence)
      
      showToast("Sequence generated successfully!", "success")
      
      // Automatically redirect to the editor page
      router.push(`/edit/${sequence.id}`)
      
    } catch (error) {
      console.error("Sequence generation error:", error);
      
      // Handle specific error types
      const apiError = error as APIError;
      
      // Authentication errors (401)
      if (apiError.status === 401) {
        console.log("Authentication error detected");
        showToast(
          "Please sign in or create an account to generate sequences",
          "auth",
          12000, // Show for longer (12 seconds)
          "center", // Display in center of screen
          [
            {
              label: "Sign In",
              onClick: () => router.push("/login")
            },
            {
              label: "Sign Up",
              onClick: () => router.push("/signup")
            }
          ]
        );
        return;
      } 
      
      // User account issues (403)
      if (apiError.status === 403) {
        console.log("User account issue detected");
        showToast(
          "Your user account is not properly set up. Please contact support.",
          "error"
        );
        return;
      } 
      
      // Handle all other errors
      const errorMessage = apiError.message || "Failed to generate sequence";
      console.log("Showing generic error toast:", errorMessage);
      showToast(errorMessage, "error");
      
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
                  key={option.value}
                  type="button"
                  onClick={() => setDifficulty(option.value)}
                  className={cn(
                    "relative border rounded-lg p-4 cursor-pointer transition-all duration-200",
                    difficulty === option.value
                      ? "border-vibrant-blue bg-vibrant-blue/5"
                      : "border-gray-200 dark:border-gray-700 hover:border-vibrant-blue/50"
                  )}
                >
                  <div className="font-medium">{option.label}</div>
                  {option.description && (
                    <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {option.description}
                    </div>
                  )}
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
                  key={option.value}
                  type="button"
                  onClick={() => setStyle(option.value)}
                  className={cn(
                    "px-4 py-2 rounded-full border-2 transition-colors",
                    style === option.value
                      ? "border-vibrant-blue bg-vibrant-blue/10 text-vibrant-blue"
                      : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                  )}
                >
                  {option.label}
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
                  key={option.value}
                  type="button"
                  onClick={() => setFocus(option.value)}
                  className={cn(
                    "px-4 py-2 rounded-full border-2 transition-colors",
                    focus === option.value
                      ? "border-vibrant-blue bg-vibrant-blue/10 text-vibrant-blue"
                      : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                  )}
                >
                  {option.label}
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