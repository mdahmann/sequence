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
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useToast as useToastHook } from "@/components/ui/use-toast"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

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

// Define the form schema
const formSchema = z.object({
  duration: z.string().min(1, "Duration is required"),
  difficulty: z.string().min(1, "Difficulty is required"),
  style: z.string().min(1, "Style is required"),
  focus: z.string().min(1, "Focus is required"),
  additionalNotes: z.string().optional(),
})

// Define the form values type
type FormValues = z.infer<typeof formSchema>

export default function EnhancedSequenceGenerator({
  onSequenceGenerated,
}: {
  onSequenceGenerated: (sequence: Sequence) => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useSupabase();
  const { toast } = useToastHook();
  const router = useRouter();
  
  // Form state
  const [duration, setDuration] = useState(30)
  const [difficulty, setDifficulty] = useState<string>("intermediate")
  const [style, setStyle] = useState<string>("vinyasa")
  const [focus, setFocus] = useState<string>("full body")
  const [additionalNotes, setAdditionalNotes] = useState("")
  
  // UI state
  const [generatedSequence, setGeneratedSequence] = useState<Sequence | null>(null)
  
  // Create form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      duration: "30",
      difficulty: "intermediate",
      style: "vinyasa",
      focus: "full body",
      additionalNotes: "",
    },
  })
  
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
  
  async function handleGenerateSequence(values: FormValues) {
    setIsLoading(true);
    setError(null);
    
    try {
      // Check if user is authenticated
      if (!isAuthenticated) {
        toast({
          variant: "destructive",
          title: "Authentication required",
          description: "Please sign in or sign up to generate sequences.",
        });
        return;
      }
      
      const response = await fetch("/api/sequence/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          duration: Number(values.duration),
          difficulty: values.difficulty,
          style: values.style,
          focus: values.focus,
          additionalNotes: values.additionalNotes
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate sequence");
      }
      
      const generatedSequence = await response.json();
      onSequenceGenerated(generatedSequence);
      
      toast({
        title: "Sequence generated",
        description: "Your yoga sequence has been created successfully.",
      });
      
    } catch (error: any) {
      console.error("Error generating sequence:", error);
      setError(error.message || "An unexpected error occurred");
      
      toast({
        variant: "destructive",
        title: "Generation failed",
        description: error.message || "Failed to generate sequence. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  return (
    <div className="sequence-generator">
      <Card>
        <CardHeader>
          <CardTitle>Generate Yoga Sequence</CardTitle>
          <CardDescription>
            Create a personalized yoga sequence based on your preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleGenerateSequence)} className="space-y-6">
              {/* Duration field */}
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (minutes)</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <Slider 
                          min={15} 
                          max={90} 
                          step={5} 
                          defaultValue={[Number(field.value)]}
                          onValueChange={(value) => field.onChange(value[0].toString())}
                        />
                        <div className="text-center font-medium">{field.value} minutes</div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Difficulty field */}
              <FormField
                control={form.control}
                name="difficulty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Difficulty Level</FormLabel>
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {difficultyOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Style field */}
              <FormField
                control={form.control}
                name="style"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Yoga Style</FormLabel>
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select style" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {styleOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Focus field */}
              <FormField
                control={form.control}
                name="focus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Focus Area</FormLabel>
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select focus area" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {focusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Additional notes field */}
              <FormField
                control={form.control}
                name="additionalNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any specific requests or notes for your sequence..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {error && (
                <div className="bg-destructive/15 p-3 rounded-md text-destructive text-sm">
                  {error}
                </div>
              )}
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Sequence"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
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