"use server"

import { createServerSupabaseClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { v4 as uuidv4 } from "uuid"
import { Sequence, SequencePhase } from "@/types/sequence"
import { generateSequence as generateSequenceAPI } from "../api/generate-sequence/handler"
import { serverSequenceService } from "@/lib/services/server-sequence-service"

type GenerateSequenceParams = {
  userId: string
  duration: number
  difficulty: string
  style: string
  focusArea: string
  additionalNotes?: string
  peakPose?: {
    id: string
    name: string
    sanskrit_name?: string
  }
}

export async function generateSequence(params: GenerateSequenceParams) {
  const { userId, duration, difficulty, style, focusArea, additionalNotes } = params

  console.log("Starting sequence generation with params:", {
    userId,
    duration,
    difficulty,
    style,
    focusArea,
    additionalNotesLength: additionalNotes?.length
  });

  try {
    // Step 1: Generate just the sequence structure
    const sequenceStructure = await serverSequenceService.generateSequenceStructure({
      duration,
      difficulty: difficulty as any,
      style: style as any,
      focus: focusArea as any,
      additionalNotes,
      peakPose: params.peakPose
    });
    
    console.log("Generated sequence structure:", sequenceStructure.name);
    
    // Create an initial sequence with placeholder poses
    const initialSequenceId = uuidv4();
    const now = new Date().toISOString();
    
    // Convert structure to sequence format with loading placeholders
    const initialSequence: Sequence = {
      id: initialSequenceId,
      name: sequenceStructure.name,
      description: sequenceStructure.description,
      duration_minutes: duration,
      difficulty: difficulty,
      style: style,
      focus: focusArea,
      phases: sequenceStructure.segments.map(segment => {
        // Create a phase for each segment
        const phase: SequencePhase = {
          id: uuidv4(),
          name: segment.name,
          description: segment.description,
          poses: [] // Initially empty, will be populated later
        };
        
        // For UI display purposes, add placeholder poses
        const placeholderCount = Math.ceil(segment.durationMinutes / 2);
        for (let i = 0; i < placeholderCount; i++) {
          phase.poses.push({
            id: `placeholder-${uuidv4()}`,
            pose_id: "placeholder",
            name: "__loading__", // Special marker for UI to know this is a placeholder
            duration_seconds: 30,
            position: i + 1
          });
        }
        
        return phase;
      }),
      created_at: now,
      updated_at: now,
      is_favorite: false,
      notes: sequenceStructure.intention || additionalNotes || "",
      structureOnly: true // Mark this as structure-only for the UI
    };
    
    console.log("Created initial sequence structure with ID:", initialSequenceId);
    
    // Skip any additional processing and return immediately
    // This ensures we return to the client as fast as possible
    return { sequence: initialSequence, structureOnly: true };
    
    /* Removed for two-step approach:
    const result = await generateSequenceAPI({
      userId,
      duration,
      difficulty,
      style,
      focusArea, 
      additionalNotes
    });
    
    if ('error' in result) {
      console.error("Error from API handler:", result.error);
      return { error: result.error };
    }
    
    console.log("Sequence generated successfully:", result.sequence?.id);
    revalidatePath("/flows");
    
    return { sequence: result.sequence };
    */
  } catch (error: any) {
    console.error("Error generating sequence:", error);
    return { error: error.message || "Failed to generate sequence" };
  }
}

