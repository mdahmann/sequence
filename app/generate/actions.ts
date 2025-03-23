"use server"

import { createServerSupabaseClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { v4 as uuidv4 } from "uuid"
import { Sequence, SequencePhase } from "@/types/sequence"
import { serverSequenceService } from "@/lib/services/server-sequence-service"
import { SequenceParams } from "@/types/sequence"

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
    // Generate the complete sequence
    const sequence = await serverSequenceService.generateSequence({
      duration,
      difficulty: difficulty as "beginner" | "intermediate" | "advanced",
      style: style as "vinyasa" | "hatha" | "yin" | "power" | "restorative",
      focus: focusArea as "full body" | "upper body" | "lower body" | "core" | "balance" | "flexibility",
      additionalNotes
    });

    // Return the complete sequence
    return { sequence };
    
  } catch (error: any) {
    console.error("Error in sequence generation:", error);
    return { error: error.message || "Failed to generate sequence" };
  }
}

