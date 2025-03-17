import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { getYogaGuidelines } from "@/lib/server-utils"

export async function POST(req: NextRequest) {
  try {
    const { poseId, side, existingCues } = await req.json()

    if (!poseId) {
      return NextResponse.json({ error: "Pose ID is required" }, { status: 400 })
    }

    // Get the Supabase client
    const supabase = await createServerSupabaseClient()

    // Fetch the pose details
    const { data: pose, error: poseError } = await supabase
      .from("poses")
      .select("*")
      .eq("id", poseId)
      .single()

    if (poseError || !pose) {
      return NextResponse.json(
        { error: `Error fetching pose: ${poseError?.message || "Pose not found"}` },
        { status: 404 }
      )
    }

    // Read yoga guidelines content - now from server-utils
    const guidelinesContent = await getYogaGuidelines()

    // Generate AI teaching cues
    const prompt = `
      You are an expert yoga instructor with deep knowledge of teaching cues and alignment principles. 
      Generate detailed teaching cues for the following yoga pose.

      ${guidelinesContent ? '--- YOGA GUIDELINES EXCERPT ---\n' + guidelinesContent.split('## Common Teaching Cues')[1] + '\n---\n\n' : ''}

      POSE DETAILS:
      - English Name: ${pose.english_name}
      - Sanskrit Name: ${pose.sanskrit_name || "N/A"}
      - Category: ${pose.category || "N/A"}
      - Difficulty Level: ${pose.difficulty_level || "N/A"}
      - Side: ${side || "Both/Center"}
      - Description: ${pose.description || "N/A"}
      - Benefits: ${pose.benefits || "N/A"}
      - Contraindications: ${pose.contraindications || "N/A"}
      - Breath Instructions: ${pose.breath_instructions || "N/A"}
      - Anatomical Focus: ${JSON.stringify(pose.anatomical_focus) || "N/A"}
      
      ${existingCues ? `EXISTING CUES: ${existingCues}` : ""}

      Create comprehensive teaching cues for this pose that include:
      1. Entry/setup instructions
      2. Key alignment points
      3. Common misalignments to avoid
      4. Breath guidance
      5. Modifications for different ability levels
      6. Sensations to notice
      7. Specific cues for the selected side (if applicable)

      The cues should be clear, concise, and use accessible language while maintaining anatomical accuracy.
      Format the response as a cohesive paragraph that flows naturally as if being spoken by a teacher.
      Keep the total length to 3-5 sentences for clarity and focus.
    `

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt,
      temperature: 0.7,
      maxTokens: 500,
      topP: 0.95,
    })

    return NextResponse.json({ cues: text.trim() })
  } catch (error: any) {
    console.error("Error generating teaching cues:", error)
    return NextResponse.json(
      { error: error.message || "Failed to generate teaching cues" },
      { status: 500 }
    )
  }
} 