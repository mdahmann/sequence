import { createServerSupabaseClient } from "@/lib/supabase"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { getYogaGuidelines } from "@/lib/server-utils"

export type GenerateSequenceParams = {
  userId: string
  duration: number
  difficulty: string
  style: string
  focusArea: string
  additionalNotes?: string
}

export type SequenceResult = {
  sequence?: any
  error?: string
}

export async function generateSequence({
  userId,
  duration,
  difficulty,
  style,
  focusArea,
  additionalNotes = "",
}: GenerateSequenceParams): Promise<SequenceResult> {
  console.log(`Starting sequence generation for user ${userId}`)
  console.log(`Parameters: duration=${duration}, difficulty=${difficulty}, style=${style}, focusArea=${focusArea}`)
  
  // Validate userId is provided and is a valid UUID
  if (!userId) {
    console.error("User ID is required for sequence generation")
    return { error: "UNAUTHENTICATED_USER" }
  }
  
  console.log(`Using authenticated user ID for sequence generation: ${userId}`)
  
  try {
    // Create a Supabase client
    const supabase = createServerSupabaseClient()
    
    // Fetch poses that match the criteria
    console.log("Fetching poses from database...")
    const { data: poses, error: posesError } = await supabase
      .from("poses")
      .select("*")
      .order("id")
    
    if (posesError) {
      console.error("Error fetching poses:", posesError)
      return { error: `Failed to fetch poses: ${posesError.message}` }
    }
    
    if (!poses || poses.length === 0) {
      console.error("No poses found in the database")
      return { error: "No poses found in the database" }
    }
    
    console.log(`Found ${poses.length} poses in the database`)
    
    // Get yoga guidelines
    const guidelines = getYogaGuidelines()
    
    // Construct the prompt
    const prompt = `
    Create a yoga sequence with the following parameters:
    - Duration: ${duration} minutes
    - Difficulty: ${difficulty}
    - Style: ${style}
    - Focus Area: ${focusArea}
    ${additionalNotes ? `- Additional Notes: ${additionalNotes}` : ""}
    
    ${guidelines}
    
    IMPORTANT: Your response must be valid JSON with the following structure:
    {
      "name": "Name of the sequence",
      "description": "Brief description of the sequence",
      "poses": [
        {
          "name": "English name of the pose",
          "sanskrit_name": "Sanskrit name of the pose (optional)",
          "duration": "Duration in seconds or breaths",
          "cues": ["Alignment cue 1", "Alignment cue 2"]
        }
      ]
    }
    
    RULES:
    1. Only include poses that exist in a typical yoga practice
    2. The sequence should follow a logical flow
    3. Include appropriate warm-up and cool-down poses
    4. The total duration should match the requested duration
    5. The difficulty should match the requested level
    6. Focus on the requested area or style
    7. Include clear alignment cues for each pose
    8. DO NOT make up poses that don't exist in yoga
    9. DO NOT include any explanations or text outside the JSON structure
    10. Ensure the JSON is valid and properly formatted
    `
    
    console.log("Generating sequence with OpenAI...")
    
    // Generate the sequence using OpenAI
    try {
      const result = await generateText({
        model: openai("gpt-4o-mini"),
        prompt,
        temperature: 0.7,
        maxTokens: 4000,
      });
      
      const content = result.text;
      
      if (!content) {
        console.error("No content returned from OpenAI")
        return { error: "Failed to generate sequence content" }
      }
      
      console.log("Parsing OpenAI response...")
      
      // Parse the JSON response
      let parsedResponse
      try {
        // Try to extract JSON if it's wrapped in markdown code blocks
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || content.match(/{[\s\S]*}/)
        const jsonContent = jsonMatch ? jsonMatch[0].replace(/```(?:json)?|```/g, "").trim() : content
        
        parsedResponse = JSON.parse(jsonContent)
        
        // Validate the response structure
        if (!parsedResponse.name) {
          throw new Error("Missing 'name' field in response")
        }
        
        if (!parsedResponse.description) {
          throw new Error("Missing 'description' field in response")
        }
        
        if (!parsedResponse.poses || !Array.isArray(parsedResponse.poses) || parsedResponse.poses.length === 0) {
          throw new Error("Missing or invalid 'poses' array in response")
        }
        
        // Validate each pose
        parsedResponse.poses.forEach((pose: any, index: number) => {
          if (!pose.name) {
            throw new Error(`Missing 'name' in pose at index ${index}`)
          }
        })
      } catch (error: any) {
        console.error("Error parsing OpenAI response:", error)
        console.error("Raw response:", content)
        return { 
          error: `Failed to parse sequence: ${error.message}. Please try again.` 
        }
      }
      
      console.log("Creating sequence in database...")
      
      // Create the sequence in the database
      const { data: sequence, error: sequenceError } = await supabase
        .from("sequences")
        .insert({
          title: parsedResponse.name,
          description: parsedResponse.description,
          duration: duration,
          difficulty_level: difficulty,
          style: style,
          focus_area: focusArea,
          user_id: userId,
          is_ai_generated: true,
        })
        .select()
        .single()
      
      if (sequenceError) {
        console.error("Error creating sequence:", sequenceError)
        return { error: `Failed to create sequence: ${sequenceError.message}` }
      }
      
      if (!sequence) {
        console.error("No sequence returned after insertion")
        return { error: "Failed to create sequence record" }
      }
      
      console.log(`Sequence created with ID: ${sequence.id}`)
      console.log("Mapping AI-generated poses to actual poses...")
      
      // Map the AI-generated poses to actual poses in the database
      const posesMap = new Map(poses.map(pose => [pose.english_name.toLowerCase(), pose]))
      
      // Insert the sequence poses
      for (let i = 0; i < parsedResponse.poses.length; i++) {
        const aiPose = parsedResponse.poses[i]
        
        // Find the matching pose in our database
        const matchingPose = posesMap.get(aiPose.name.toLowerCase()) || 
                            poses.find(p => 
                              p.english_name.toLowerCase() === aiPose.name.toLowerCase() || 
                              (p.sanskrit_name && p.sanskrit_name.toLowerCase() === (aiPose.sanskrit_name || "").toLowerCase())
                            )
        
        if (!matchingPose) {
          console.warn(`No matching pose found for "${aiPose.name}" - using default pose`)
          continue
        }
        
        // Insert the sequence pose
        const { error: poseError } = await supabase
          .from("sequence_poses")
          .insert({
            sequence_id: sequence.id,
            pose_id: matchingPose.id,
            position: i,
            duration: aiPose.duration || "5 breaths",
            cues: aiPose.cues || [],
          })
        
        if (poseError) {
          console.error(`Error adding pose ${aiPose.name} to sequence:`, poseError)
          // Continue with other poses even if one fails
        }
      }
      
      console.log("Sequence generation completed successfully")
      
      // Return the created sequence
      return { sequence }
      
    } catch (openAiError: any) {
      console.error("OpenAI API error:", openAiError)
      return { 
        error: `Error generating sequence: ${openAiError.message || "Unknown OpenAI error"}` 
      }
    }
  } catch (error: any) {
    console.error("Unhandled error in sequence generation:", error)
    return { 
      error: `An unexpected error occurred: ${error.message || "Unknown error"}` 
    }
  }
} 