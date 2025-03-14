"use server"

import { createServerSupabaseClient } from "@/lib/supabase"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { revalidatePath } from "next/cache"

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

  try {
    const supabase = createServerSupabaseClient()

    // Fetch poses that match the criteria
    const { data: poses } = await supabase
      .from("poses")
      .select("*")
      .eq("difficulty_level", difficulty)
      .order("english_name")

    if (!poses || poses.length === 0) {
      return { error: "No poses found matching the criteria" }
    }

    // Generate AI sequence
    const prompt = `
      Create a ${duration}-minute ${difficulty} ${style} yoga sequence focusing on ${focusArea}.
      
      Additional notes: ${additionalNotes || "None"}
      
      Structure the sequence according to traditional yoga principles:
      1. Centering/Warm-up (15% of time)
      2. Standing Poses/Main Sequence (60% of time)
      3. Peak Pose related to ${focusArea} (10% of time)
      4. Cool-down/Closing (15% of time)
      
      For each section, select appropriate poses from this list:
      ${poses
        .slice(0, 50)
        .map((p) => `${p.english_name} (${p.sanskrit_name || "No Sanskrit name"})`)
        .join(", ")}
      
      Format your response as a JSON object with this structure:
      {
        "title": "Title for the sequence",
        "description": "Brief description of the sequence",
        "sections": [
          {
            "name": "Section name (e.g., Warm-up)",
            "description": "Brief description of this section's purpose",
            "poses": [
              {
                "poseName": "English name of pose",
                "sanskritName": "Sanskrit name",
                "duration": duration in seconds,
                "cues": "Teaching cues for this pose"
              }
            ]
          }
        ]
      }
    `

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt,
      temperature: 0.7,
      maxTokens: 2000,
    })

    // Parse the AI response
    const sequenceData = JSON.parse(text)

    // Create the sequence in the database
    const { data: sequence, error: sequenceError } = await supabase
      .from("sequences")
      .insert({
        user_id: userId,
        title: sequenceData.title,
        description: sequenceData.description,
        duration,
        difficulty_level: difficulty,
        style,
        focus_area: focusArea,
        is_ai_generated: true,
      })
      .select()
      .single()

    if (sequenceError || !sequence) {
      return { error: `Error creating sequence: ${sequenceError?.message}` }
    }

    // Map AI-generated poses to actual poses in the database
    const posePromises = sequenceData.sections.flatMap((section: any, sectionIndex: number) => {
      return section.poses.map(async (aiPose: any, poseIndex: number) => {
        // Find the closest matching pose in the database
        const { data: matchingPoses } = await supabase
          .from("poses")
          .select("*")
          .ilike("english_name", `%${aiPose.poseName.split(" ")[0]}%`)
          .limit(1)

        const poseId = matchingPoses && matchingPoses.length > 0 ? matchingPoses[0].id : poses[0].id // Fallback to first pose if no match

        // Calculate position based on section and pose index
        const position = sectionIndex * 100 + poseIndex

        return {
          sequence_id: sequence.id,
          pose_id: poseId,
          position,
          duration: aiPose.duration || 30, // Default to 30 seconds if not specified
          cues: aiPose.cues || "",
        }
      })
    })

    // Wait for all pose mappings to complete
    const poseInserts = await Promise.all(posePromises)

    // Insert all sequence poses
    const { error: posesError } = await supabase.from("sequence_poses").insert(poseInserts)

    if (posesError) {
      return { error: `Error adding poses to sequence: ${posesError.message}` }
    }

    revalidatePath("/flows")

    return { sequence }
  } catch (error: any) {
    console.error("Error generating sequence:", error)
    return { error: error.message || "Failed to generate sequence" }
  }
}

