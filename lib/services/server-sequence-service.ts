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

// Create an OpenAI instance if the API key is available
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export const serverSequenceService = {
  async generateSequence(params: SequenceParams): Promise<Sequence> {
    console.log("serverSequenceService: Generating sequence with params:", params)
    
    // Log environment variable availability (without exposing values)
    console.log("Environment variables check:", {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY
    })
    
    // Create a server-side Supabase client
    const supabase = createServerSupabaseClient()
    
    try {
      // Fetch all poses from the database without requiring authentication
      const { data: poses, error: posesError } = await supabase
        .from('poses')
        .select('*')
      
      if (posesError || !poses) {
        console.error("serverSequenceService: Error fetching poses:", posesError || "No poses found")
        throw new Error("Failed to fetch poses")
      }
      
      console.log(`serverSequenceService: Successfully fetched ${poses.length} poses from database`)
      
      // Check if we can use OpenAI
      if (openai && process.env.OPENAI_API_KEY) {
        try {
          console.log("serverSequenceService: Attempting to use OpenAI for sequence generation")
          return await this.generateWithOpenAI(params, poses);
        } catch (aiError) {
          console.error("serverSequenceService: Error with OpenAI, falling back to basic generation:", aiError)
          // Fall back to basic generation if OpenAI fails
          return this.generateBasicSequence(params, poses);
        }
      } else {
        console.log("serverSequenceService: OpenAI not available, using basic generation")
        return this.generateBasicSequence(params, poses);
      }
    } catch (error: any) {
      console.error("serverSequenceService: Error generating sequence:", error.message)
      throw error
    }
  },
  
  // Generate a sequence using OpenAI
  async generateWithOpenAI(params: SequenceParams, poses: any[]): Promise<Sequence> {
    if (!openai) {
      throw new Error("OpenAI client not initialized");
    }
    
    // Prepare the prompt for OpenAI
    const prompt = this.buildPrompt(params, poses);
    
    // Call OpenAI API to generate a sequence
    console.log("serverSequenceService: Calling OpenAI API");
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
    });
    
    // Parse the response
    console.log("serverSequenceService: Received response from OpenAI");
    const responseContent = completion.choices[0].message.content;
    
    if (!responseContent) {
      throw new Error("Empty response from OpenAI");
    }
    
    // Parse the JSON response
    let generatedSequence: any;
    try {
      generatedSequence = JSON.parse(responseContent);
      console.log("serverSequenceService: Successfully parsed OpenAI response");
    } catch (error) {
      console.error("serverSequenceService: Error parsing OpenAI response:", error);
      console.log("serverSequenceService: Raw response:", responseContent);
      throw new Error("Failed to parse OpenAI response");
    }
    
    const now = new Date().toISOString();
    
    // Create a properly formatted sequence object
    const sequence: Sequence = {
      id: uuidv4(),
      name: generatedSequence.name || `${params.duration} min ${params.difficulty} ${params.style} for ${params.focus}`,
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
    };
    
    // Process each phase from the generated sequence
    if (Array.isArray(generatedSequence.phases)) {
      // Map the generated phases to our Sequence type
      sequence.phases = generatedSequence.phases.map((phase: any, phaseIndex: number) => {
        const sequencePhase: SequencePhase = {
          id: uuidv4(),
          name: phase.name,
          description: phase.description || "",
          poses: []
        };
        
        // Map the poses in each phase
        if (Array.isArray(phase.poses)) {
          sequencePhase.poses = phase.poses.map((pose: any, poseIndex: number) => {
            // Find the matching pose from our database
            const matchingPose = poses.find(
              (dbPose) => dbPose.name.toLowerCase() === pose.name.toLowerCase()
            );
            
            // If we couldn't find a matching pose, log a warning but continue
            if (!matchingPose) {
              console.warn(`No matching pose found for: ${pose.name}`);
            }
            
            const sequencePose: SequencePose = {
              id: uuidv4(),
              pose_id: matchingPose?.id || "unknown",
              name: pose.name,
              duration_seconds: pose.duration_seconds || 30,
              side: pose.side || null,
              cues: Array.isArray(pose.cues) ? pose.cues.join(", ") : pose.cues || "",
              position: phaseIndex * 100 + poseIndex + 1, // Generate a position based on phase and pose index
              sanskrit_name: matchingPose?.sanskrit_name || undefined,
              image_url: matchingPose?.image_url || undefined
            };
            
            return sequencePose;
          });
        }
        
        return sequencePhase;
      });
    }
    
    console.log("serverSequenceService: Successfully generated AI sequence", sequence.name);
    return sequence;
  },
  
  // Generate a basic sequence without AI
  generateBasicSequence(params: SequenceParams, poses: any[]): Sequence {
    console.log("serverSequenceService: Generating basic sequence");
    
    // Get a sample of poses based on difficulty and focus
    const filteredPoses = poses.filter(pose => {
      // Simple filter matching - will be replaced by OpenAI later
      const matchesDifficulty = 
        (params.difficulty === 'beginner' && pose.difficulty_level === 'beginner') ||
        (params.difficulty === 'intermediate' && 
          ['beginner', 'intermediate'].includes(pose.difficulty_level || '')) ||
        (params.difficulty === 'advanced');
          
      const matchesFocus = 
        params.focus === 'full body' || 
        (pose.category || '').toLowerCase().includes(params.focus);
          
      return matchesDifficulty && matchesFocus;
    });
    
    // If we don't have enough poses after filtering, use all poses
    const posesToUse = filteredPoses.length >= 6 ? filteredPoses : poses;
    
    // Calculate poses per phase
    const totalPoses = Math.min(posesToUse.length, Math.floor(params.duration / 3));
    const phaseLengths = {
      warmUp: Math.max(2, Math.floor(totalPoses * 0.3)),
      mainSequence: Math.max(3, Math.floor(totalPoses * 0.5)),
      coolDown: Math.max(1, Math.floor(totalPoses * 0.2))
    };
    
    const now = new Date().toISOString();
    
    // Create a properly formatted sequence object
    const sequence: Sequence = {
      id: uuidv4(),
      name: `${params.duration} min ${params.difficulty} ${params.style} for ${params.focus}`,
      description: `A ${params.duration} minute ${params.difficulty} ${params.style} yoga sequence focusing on ${params.focus}.`,
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
    
    // Create phases
    const phaseStructure = [
      {
        name: "Warm Up",
        description: "Gentle poses to prepare the body",
        count: phaseLengths.warmUp
      },
      {
        name: "Main Sequence",
        description: "Core yoga practice focusing on " + params.focus,
        count: phaseLengths.mainSequence
      },
      {
        name: "Cool Down",
        description: "Gentle poses to finish practice",
        count: phaseLengths.coolDown
      }
    ];
    
    // Build phases
    let poseIndex = 0;
    sequence.phases = phaseStructure.map((phaseInfo, phaseIndex) => {
      const sequencePhase: SequencePhase = {
        id: uuidv4(),
        name: phaseInfo.name,
        description: phaseInfo.description,
        poses: []
      };
      
      // Add poses to this phase
      for (let i = 0; i < phaseInfo.count && poseIndex < posesToUse.length; i++) {
        const pose = posesToUse[poseIndex % posesToUse.length];
        poseIndex++;
        
        // For bilateral poses, add both sides
        const side = pose.is_bilateral ? (i % 2 === 0 ? "right" : "left") : null;
        
        const sequencePose: SequencePose = {
          id: uuidv4(),
          pose_id: pose.id || "unknown",
          name: pose.name,
          duration_seconds: 30,
          side: side,
          cues: "Focus on proper alignment and breathe deeply",
          position: phaseIndex * 100 + i + 1,
          sanskrit_name: pose.sanskrit_name,
          image_url: pose.image_url
        };
        
        sequencePhase.poses.push(sequencePose);
        
        // If bilateral, add the second side immediately after
        if (pose.is_bilateral && side === "right") {
          const secondSidePose: SequencePose = {
            id: uuidv4(),
            pose_id: pose.id || "unknown",
            name: pose.name,
            duration_seconds: 30,
            side: "left",
            cues: "Focus on proper alignment and breathe deeply",
            position: phaseIndex * 100 + i + 1.5,
            sanskrit_name: pose.sanskrit_name,
            image_url: pose.image_url
          };
          sequencePhase.poses.push(secondSidePose);
        }
      }
      
      return sequencePhase;
    });
    
    console.log("serverSequenceService: Successfully generated basic sequence", sequence.name);
    return sequence;
  },
  
  buildPrompt(params: SequenceParams, poses: any[]): string {
    // Create a list of available pose names to include in the prompt
    const poseNames = poses.map(pose => pose.name).join(", ");
    
    // Add yoga guidelines based on style and focus
    const yogaGuidelines = this.getYogaGuidelines(params.style, params.focus, params.difficulty);
    
    return `
    Create a yoga sequence with the following parameters:
    - Duration: ${params.duration} minutes
    - Difficulty: ${params.difficulty}
    - Style: ${params.style}
    - Focus Area: ${params.focus}
    - Additional Notes: ${params.additionalNotes || "None"}
    
    YOGA GUIDELINES:
    ${yogaGuidelines}
    
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
  
  getYogaGuidelines(style: string, focus: string, difficulty: string): string {
    // Common principles
    let guidelines = "- Sequence should flow naturally from one pose to the next\n";
    guidelines += "- Balance seated, standing, and supine poses appropriately\n";
    guidelines += "- Include counter-poses after deep or intense poses\n";
    
    // Style-specific guidelines
    switch (style) {
      case "vinyasa":
        guidelines += "- Connect breath with movement (one breath, one movement)\n";
        guidelines += "- Use sun salutations as linking sequences\n";
        guidelines += "- Build momentum gradually and peak in the middle of the sequence\n";
        break;
        
      case "hatha":
        guidelines += "- Hold poses longer for deeper stretch and stability (45-90 seconds)\n";
        guidelines += "- Focus on proper alignment and body awareness\n";
        guidelines += "- Include plenty of time for proper adjustment in each pose\n";
        break;
        
      case "yin":
        guidelines += "- Hold poses for 2-5 minutes to target deep connective tissues\n";
        guidelines += "- Focus on passive stretching rather than muscular engagement\n";
        guidelines += "- Encourage use of props for support\n";
        break;
        
      case "power":
        guidelines += "- Include more dynamic and strength-building poses\n";
        guidelines += "- Build heat through continuous movement\n";
        guidelines += "- Add challenging variations of traditional poses\n";
        break;
        
      case "restorative":
        guidelines += "- Include extensive use of props for complete support\n";
        guidelines += "- Hold poses for 5-10 minutes to deeply relax the body\n";
        guidelines += "- Focus on complete surrender and comfort in poses\n";
        break;
    }
    
    // Focus area specific guidelines
    switch (focus) {
      case "full body":
        guidelines += "- Include a balanced mix of standing, seated, and supine poses\n";
        guidelines += "- Target all major muscle groups and joint movements\n";
        break;
        
      case "upper body":
        guidelines += "- Emphasize shoulder openers, arm balances, and chest expansions\n";
        guidelines += "- Include poses that strengthen arms, shoulders, and upper back\n";
        break;
        
      case "lower body":
        guidelines += "- Focus on hip openers, hamstring stretches, and leg strengtheners\n";
        guidelines += "- Include ankle mobility and foot stability exercises\n";
        break;
        
      case "core":
        guidelines += "- Incorporate poses that engage the deep core muscles\n";
        guidelines += "- Balance between core strengthening and core stretching\n";
        break;
        
      case "balance":
        guidelines += "- Progress from stable to more challenging balance poses\n";
        guidelines += "- Include preparatory poses that build required strength\n";
        break;
        
      case "flexibility":
        guidelines += "- Hold stretches longer to increase flexibility\n";
        guidelines += "- Warm up thoroughly before deep stretches\n";
        break;
    }
    
    // Difficulty level adjustments
    switch (difficulty) {
      case "beginner":
        guidelines += "- Avoid complex transitions between poses\n";
        guidelines += "- Include detailed alignment cues for safety\n";
        guidelines += "- Favor basic poses with modifications\n";
        break;
        
      case "intermediate":
        guidelines += "- Include some challenging variations of basic poses\n";
        guidelines += "- Include more complex transitions between poses\n";
        break;
        
      case "advanced":
        guidelines += "- Include challenging pose variations and transitions\n";
        guidelines += "- Longer holds or more dynamic movements\n";
        guidelines += "- Create creative and unique sequences\n";
        break;
    }
    
    return guidelines;
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