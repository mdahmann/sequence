import { createServerSupabaseClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { OpenAI } from 'openai'
import { v4 as uuidv4 } from 'uuid'
import { 
  Sequence, 
  SequencePhase, 
  SequencePose,
  SequenceParams
} from '@/types/sequence'

// Create an OpenAI instance
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const serverSequenceService = {
  async generateSequence(params: SequenceParams): Promise<Sequence> {
    console.log("serverSequenceService: Generating sequence with params:", params)
    
    // Create a server-side Supabase client
    const supabase = createServerSupabaseClient()
    
    // Get the current session to check authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      console.error("serverSequenceService: Authentication error:", sessionError || "No session found")
      throw new Error("Authentication required")
    }
    
    console.log("serverSequenceService: Authentication successful, user:", 
      {
        id: session.user.id,
        email: session.user.email,
        provider: session.user.app_metadata?.provider || 'unknown'
      }
    )
    
    try {
      // Fetch all poses from the database
      const { data: poses, error: posesError } = await supabase
        .from('poses')
        .select('*')
      
      if (posesError || !poses) {
        console.error("serverSequenceService: Error fetching poses:", posesError || "No poses found")
        throw new Error("Failed to fetch poses")
      }
      
      console.log(`serverSequenceService: Successfully fetched ${poses.length} poses from database`)
      
      // Prepare the prompt for OpenAI
      const prompt = this.buildPrompt(params, poses)
      
      // Call OpenAI API to generate a sequence
      console.log("serverSequenceService: Calling OpenAI API")
      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo",
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content: "You are a professional yoga instructor tasked with creating appropriate yoga sequences based on user preferences. You will ONLY use poses from the provided database."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" }
      })
      
      // Parse the response
      console.log("serverSequenceService: Received response from OpenAI")
      const responseContent = completion.choices[0].message.content
      
      if (!responseContent) {
        throw new Error("Empty response from OpenAI")
      }
      
      // Parse the JSON response
      let generatedSequence: any
      try {
        generatedSequence = JSON.parse(responseContent)
      } catch (error) {
        console.error("serverSequenceService: Error parsing OpenAI response:", error)
        console.log("serverSequenceService: Raw response:", responseContent)
        throw new Error("Failed to parse OpenAI response")
      }
      
      const now = new Date().toISOString();
      
      // Create a properly formatted sequence object
      const sequence: Sequence = {
        id: uuidv4(),
        name: generatedSequence.name || `${params.difficulty} ${params.style} Sequence for ${params.focus}`,
        description: generatedSequence.description || `A ${params.duration} minute ${params.difficulty} ${params.style} yoga sequence focusing on ${params.focus}.`,
        duration_minutes: params.duration,
        difficulty: params.difficulty,
        style: params.style,
        focus: params.focus,
        notes: params.additionalNotes || "",
        phases: [],
        created_at: now,
        updated_at: now,
        is_favorite: false
      }
      
      // Process each phase from the generated sequence
      if (Array.isArray(generatedSequence.phases)) {
        // Map the generated phases to our Sequence type
        sequence.phases = generatedSequence.phases.map((phase: any, phaseIndex: number) => {
          const sequencePhase: SequencePhase = {
            id: uuidv4(),
            name: phase.name,
            description: phase.description || "",
            poses: []
          }
          
          // Map the poses in each phase
          if (Array.isArray(phase.poses)) {
            sequencePhase.poses = phase.poses.map((pose: any, poseIndex: number) => {
              // Find the matching pose from our database
              const matchingPose = poses.find(
                (dbPose) => dbPose.name.toLowerCase() === pose.name.toLowerCase()
              )
              
              // If we couldn't find a matching pose, log a warning but continue
              if (!matchingPose) {
                console.warn(`No matching pose found for: ${pose.name}`)
              }
              
              const sequencePose: SequencePose = {
                id: uuidv4(),
                pose_id: matchingPose?.id || "unknown",
                name: pose.name,
                duration_seconds: pose.duration_seconds || 30,
                side: pose.side || null,
                cues: Array.isArray(pose.cues) ? pose.cues.join(", ") : "",
                position: phaseIndex * 100 + poseIndex + 1, // Generate a position based on phase and pose index
                sanskrit_name: matchingPose?.sanskrit_name || undefined,
                image_url: matchingPose?.image_url || undefined
              }
              
              return sequencePose
            })
          }
          
          return sequencePhase
        })
      }
      
      console.log("serverSequenceService: Successfully generated sequence", sequence.name)
      return sequence
      
    } catch (error: any) {
      console.error("serverSequenceService: Error generating sequence:", error.message)
      throw error
    }
  },
  
  buildPrompt(params: SequenceParams, poses: any[]): string {
    // Create a list of available pose names to include in the prompt
    const poseNames = poses.map(pose => pose.name).join(", ")
    
    return `
    Create a yoga sequence with the following parameters:
    - Duration: ${params.duration} minutes
    - Difficulty: ${params.difficulty}
    - Style: ${params.style}
    - Focus Area: ${params.focus}
    - Additional Notes: ${params.additionalNotes || "None"}
    
    IMPORTANT RULES:
    1. ONLY use poses from this list: ${poseNames}
    2. Create a sequence with exactly 3 phases: "Warm Up", "Main Sequence", and "Cool Down"
    3. Each phase should have an appropriate duration that adds up to the total requested duration
    4. Match the difficulty level requested
    5. For each pose include:
       - name (must exactly match a name from the provided list)
       - duration_seconds (how long to hold the pose)
       - side (if applicable, either "left", "right", or null)
       - transition (brief instruction on how to move to this pose)
       - description (short description of the pose)
       - cues (array of alignment cues or breathing instructions)
    
    Return the sequence as a JSON object with this structure:
    {
      "name": "Name of the sequence",
      "description": "Description of the sequence",
      "phases": [
        {
          "name": "Warm Up",
          "description": "Description of this phase",
          "poses": [
            {
              "name": "Pose Name",
              "description": "Description of this pose",
              "duration_seconds": number,
              "side": "left" | "right" | null,
              "transition": "How to transition to this pose",
              "cues": ["Cue 1", "Cue 2"]
            },
            ...more poses
          ]
        },
        ...more phases
      ]
    }
    `
  },

  async setAuthToken(token: string, client: any) {
    // This method can be used to set an auth token directly on the client
    // Useful for API routes that receive an Authorization header
    return await client.auth.setSession({
      access_token: token,
      refresh_token: "",
    });
  },
} 