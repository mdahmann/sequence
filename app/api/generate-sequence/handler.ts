import { createServerSupabaseClient } from "@/lib/supabase"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { getYogaGuidelines } from "@/lib/server-utils"

type GenerateSequenceParams = {
  userId: string
  duration: number
  difficulty: string
  style: string
  focusArea: string
  additionalNotes?: string
}

type SequenceResult = {
  sequence?: any
  error?: string
}

export async function generateSequence(params: GenerateSequenceParams): Promise<SequenceResult> {
  const { userId, duration, difficulty, style, focusArea, additionalNotes } = params

  console.log("API Handler: Starting sequence generation", { difficulty, style, focusArea });

  try {
    const supabase = createServerSupabaseClient()

    // Fetch poses that match the criteria
    const { data: poses } = await supabase
      .from("poses")
      .select("*")
      .eq("difficulty_level", difficulty)
      .order("english_name")

    if (!poses || poses.length === 0) {
      console.error("API Handler: No poses found matching criteria", { difficulty });
      return { error: "No poses found matching the criteria" };
    }

    console.log(`API Handler: Found ${poses.length} poses matching criteria`);

    // Read yoga guidelines content
    const guidelinesContent = await getYogaGuidelines()

    // Generate AI sequence
    const prompt = `
      You are an expert yoga instructor with deep knowledge of sequencing principles. Use the following guidelines and parameters to create a cohesive yoga sequence.

      ${guidelinesContent ? '--- YOGA SEQUENCING GUIDELINES ---\n' + guidelinesContent + '\n---\n\n' : ''}

      SEQUENCE PARAMETERS:
      - Duration: ${duration} minutes
      - Difficulty: ${difficulty}
      - Style: ${style}
      - Focus area: ${focusArea}
      - Additional notes: ${additionalNotes || "None"}
      
      AVAILABLE POSES:
      ${poses
        .slice(0, 50)
        .map((p) => `- ${p.english_name} (${p.sanskrit_name || "No Sanskrit name"})${p.category ? ` - Category: ${p.category}` : ''}${p.difficulty_level ? ` - Difficulty: ${p.difficulty_level}` : ''}${p.side_option ? ` - Side Option: ${p.side_option}` : ''}`)
        .join("\n")}
      
      Based on the guidelines and parameters, create a ${duration}-minute ${difficulty} ${style} yoga sequence focusing on ${focusArea}. 
      
      Structure the sequence according to traditional yoga principles with these sections:
      1. Centering/Warm-up (15-20% of time)
      2. Building/Main Sequence (50-60% of time)
      3. Peak pose related to ${focusArea} (10-15% of time)
      4. Cool-down/Closing (15-20% of time)
      
      YOUR RESPONSE MUST BE VALID JSON WITH EXACTLY THIS STRUCTURE:
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
                "side": "left", "right", or "" for both/center,
                "cues": "Teaching cues for this pose"
              }
            ]
          }
        ]
      }

      Follow these IMPORTANT rules:
      1. Only use poses from the AVAILABLE POSES list above
      2. Don't invent new poses
      3. Make sure the total sequence fits within ${duration} minutes
      4. Provide detailed teaching cues for each pose (2-3 sentences)
      5. Set appropriate durations for each pose based on the style
      6. Create a natural flow between poses
      7. Include appropriate transitions
      8. Ensure poses build logically toward peak poses
      9. Include counter poses where needed
      10. For poses with side options, specify "left", "right", or "" for both/center
      11. IMPORTANT: The response MUST be valid JSON with no markdown formatting or extra text before or after the JSON
    `

    console.log("API Handler: Calling OpenAI to generate sequence");
    let text;
    try {
      const result = await generateText({
        model: openai("gpt-4o-mini"),
        prompt,
        temperature: 0.7,
        maxTokens: 4000,
        topP: 0.95,
      });
      text = result.text;
    } catch (error: any) {
      console.error("API Handler: OpenAI API error:", error);
      return { error: `Error calling OpenAI: ${error.message}` };
    }

    // Clean up the response text to help with JSON parsing
    // Sometimes AI models add markdown backticks or other formatting
    text = text.trim();
    if (text.startsWith("```json")) {
      text = text.substring(7);
    } else if (text.startsWith("```")) {
      text = text.substring(3);
    }
    if (text.endsWith("```")) {
      text = text.substring(0, text.length - 3);
    }
    text = text.trim();

    // Parse the AI response 
    let sequenceData;
    try {
      console.log("API Handler: Parsing response JSON");
      sequenceData = JSON.parse(text);
      
      // Validate key fields
      if (!sequenceData.title || !sequenceData.description || !Array.isArray(sequenceData.sections)) {
        throw new Error("Missing required fields in response JSON");
      }
      
      // Validate sections
      sequenceData.sections.forEach((section: any, index: number) => {
        if (!section.name || !section.description || !Array.isArray(section.poses)) {
          throw new Error(`Missing required fields in section ${index}`);
        }
        
        // Validate poses in each section
        section.poses.forEach((pose: any, poseIndex: number) => {
          if (!pose.poseName) {
            throw new Error(`Missing pose name in section ${index}, pose ${poseIndex}`);
          }
          
          // Set defaults for optional fields
          pose.sanskritName = pose.sanskritName || "";
          pose.duration = pose.duration || 30;
          pose.side = pose.side || "";
          pose.cues = pose.cues || "";
        });
      });
    } catch (error: any) {
      console.error("API Handler: Failed to parse JSON from AI response:", error);
      console.error("API Handler: Raw response text:", text);
      return { error: `Error parsing sequence data: ${error.message}. Please try again.` };
    }

    // Create the sequence in the database
    console.log("API Handler: Creating sequence in database");
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
      .single();

    if (sequenceError || !sequence) {
      console.error("API Handler: Error creating sequence:", sequenceError);
      return { error: `Error creating sequence: ${sequenceError?.message}` };
    }

    // Map AI-generated poses to actual poses in the database
    console.log("API Handler: Mapping poses to database");
    const posePromises = sequenceData.sections.flatMap((section: any, sectionIndex: number) => {
      return section.poses.map(async (aiPose: any, poseIndex: number) => {
        // Find the closest matching pose in the database
        const { data: matchingPoses } = await supabase
          .from("poses")
          .select("*")
          .ilike("english_name", `%${aiPose.poseName.split(" ")[0]}%`)
          .limit(1);

        const poseId = matchingPoses && matchingPoses.length > 0 ? matchingPoses[0].id : poses[0].id; // Fallback to first pose if no match

        // Calculate position based on section and pose index
        const position = sectionIndex * 100 + poseIndex;

        return {
          sequence_id: sequence.id,
          pose_id: poseId,
          position,
          duration: aiPose.duration || 30, // Default to 30 seconds if not specified
          side: aiPose.side || "",
          cues: aiPose.cues || "",
        };
      });
    });

    // Wait for all pose mappings to complete
    const poseInserts = await Promise.all(posePromises);

    // Insert all sequence poses
    console.log(`API Handler: Inserting ${poseInserts.length} sequence poses`);
    const { error: posesError } = await supabase.from("sequence_poses").insert(poseInserts);

    if (posesError) {
      console.error("API Handler: Error adding poses to sequence:", posesError);
      return { error: `Error adding poses to sequence: ${posesError.message}` };
    }

    console.log(`API Handler: Sequence generated successfully with ID: ${sequence.id}`);
    return { sequence };
  } catch (error: any) {
    console.error("API Handler: Unhandled error in sequence generation:", error);
    return { error: error.message || "Failed to generate sequence" };
  }
} 