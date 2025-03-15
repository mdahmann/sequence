"use server"

import { createServerSupabaseClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { generateSequence as generateSequenceAPI } from "../api/generate-sequence/handler"

type GenerateSequenceParams = {
  userId: string
  duration: number
  difficulty: string
  style: string
  focusArea: string
  additionalNotes?: string
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
    // Call the API handler directly instead of making a fetch request
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
  } catch (error: any) {
    console.error("Error generating sequence:", error);
    return { error: error.message || "Failed to generate sequence" };
  }
}

