import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { serverSequenceService } from "@/lib/services/server-sequence-service"
import { createServerClient } from '@supabase/ssr'

// Schema for sequence parameters validation
const sequenceParamsSchema = z.object({
  duration: z.number().min(5).max(90),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  style: z.enum(["vinyasa", "hatha", "yin", "power", "restorative"]),
  focus: z.enum(["full body", "upper body", "lower body", "core", "balance", "flexibility"]),
  additionalNotes: z.string().optional()
})

export async function POST(req: NextRequest) {
  console.log("Starting POST request to /api/sequence/generate")
  
  // Check that environment variables are defined
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error("Missing Supabase environment variables");
    return NextResponse.json(
      { 
        error: "Server configuration error", 
        message: "The server is not properly configured. Please contact support." 
      },
      { status: 500 }
    )
  }
  
  try {
    // Create a Supabase client using cookies from the request
    const cookieStore = req.cookies
    console.log("Available cookies:", cookieStore.getAll().map(c => `${c.name}=${c.value.substring(0,10)}...`).join(', '))
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            // This is unused in the API route but required by the type
          },
          remove(name: string, options: any) {
            // This is unused in the API route but required by the type
          },
        },
      }
    )
    
    // Check authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error("API route: Error getting session:", sessionError)
      return NextResponse.json(
        { 
          error: "Authentication error", 
          message: "There was an error checking your authentication status." 
        },
        { status: 500 }
      )
    }
    
    if (!session?.user?.id) {
      console.log("API route: No valid session found")
      
      // Attempt to use the service role client if session is not available
      // This is a fallback mechanism
      console.log("API route: Trying to retrieve user with service role client")
      const headers = Object.fromEntries(req.headers.entries());
      console.log("Request headers:", headers);
      
      // Try to extract user ID from Authorization header if present
      const authHeader = req.headers.get('authorization');
      console.log("Auth header:", authHeader ? "Present" : "Not present");
      
      // If we have an Authorization header, use it to authenticate
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        console.log("API route: Got token from header, length:", token.length);
        
        try {
          // Verify the token and get the user - this doesn't require setting a session
          const { data: verifyData, error: verifyError } = await supabase.auth.getUser(token);
          
          if (verifyError) {
            console.error("API route: Token verification error:", verifyError);
          } else if (verifyData?.user) {
            const verifiedUser = verifyData.user;
            console.log("API route: Token verified successfully for user:", verifiedUser.id);
            
            // We now have a verified user without needing to set a session
            // Continue with the authenticated user directly
            try {
              // Parse and validate request body
              const body = await req.json()
              const validatedParams = sequenceParamsSchema.safeParse(body)
              
              if (!validatedParams.success) {
                console.log("API route: Invalid parameters - returning 400")
                return NextResponse.json(
                  { error: "Invalid parameters", details: validatedParams.error.format() },
                  { status: 400 }
                )
              }
              
              // Generate sequence with the authenticated user
              console.log("API route: Generating sequence with token auth...")
              
              // No need to create a new client - we already verified the token with the existing client
              // Just use the original supabase client which already has the token verification
              
              // Generate the sequence directly with the existing client
              const sequence = await serverSequenceService.generateSequence(validatedParams.data)
              
              // Return generated sequence
              console.log("API route: Sequence generated successfully - returning 201")
              return NextResponse.json(
                { sequence }, 
                { status: 201 }
              )
            } catch (error: any) {
              console.error("API route token error:", error.message)
              return NextResponse.json(
                { error: "Token processing error", message: error.message },
                { status: 500 }
              )
            }
          }
        } catch (tokenError) {
          console.error("API route: Error verifying token:", tokenError);
        }
      }
      
      return NextResponse.json(
        { 
          error: "Authentication required", 
          message: "Please sign in or create an account to generate sequences." 
        },
        { status: 401 }
      )
    }
    
    console.log(`API route: User authenticated with ID ${session.user.id}`)
    console.log("API route: Auth details:", {
      userId: session.user.id,
      email: session.user.email || 'not available',
      provider: session.user.app_metadata?.provider || 'unknown',
      aud: session.user.aud,
      role: session.user.role
    })
    
    // Parse and validate request body
    const body = await req.json()
    const validatedParams = sequenceParamsSchema.safeParse(body)
    
    if (!validatedParams.success) {
      console.log("API route: Invalid parameters - returning 400")
      return NextResponse.json(
        { error: "Invalid parameters", details: validatedParams.error.format() },
        { status: 400 }
      )
    }
    
    // Generate sequence
    console.log("API route: Generating sequence...")
    const sequence = await serverSequenceService.generateSequence(validatedParams.data)
    
    // Return generated sequence
    console.log("API route: Sequence generated successfully - returning 201")
    return NextResponse.json(
      { sequence }, 
      { 
        status: 201,
        headers: {
          'Set-Cookie': req.headers.get('cookie') || '',
        }
      }
    )
  } catch (error: any) {
    console.error("API route error:", error.message)
    
    // Handle specific error types
    if (error.message === "UNAUTHENTICATED_USER" || error.message.includes("UNAUTHENTICATED_USER")) {
      console.log("API route: Authentication error from service - returning 401")
      return NextResponse.json(
        { 
          error: "Authentication required", 
          message: "Please sign in or create an account to generate sequences." 
        },
        { status: 401 }
      )
    }
    
    if (error.message === "USER_NOT_FOUND" || error.message.includes("USER_NOT_FOUND")) {
      console.log("API route: User not found error - returning 403")
      return NextResponse.json(
        { 
          error: "User account issue", 
          message: "Your user account is not properly set up. Please contact support." 
        },
        { status: 403 }
      )
    }
    
    // Generic error handling
    console.log("API route: Generic error - returning 500")
    return NextResponse.json(
      { 
        error: "Sequence generation failed", 
        message: error.message || "An unexpected error occurred" 
      },
      { status: 500 }
    )
  }
} 