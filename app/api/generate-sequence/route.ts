import { NextRequest, NextResponse } from "next/server"
import { generateSequence } from "./handler"

export async function POST(req: NextRequest) {
  try {
    const params = await req.json()
    
    // Using the same handler as the server action
    const result = await generateSequence(params)
    
    if ('error' in result && result.error) {
      // Determine the appropriate status code based on the error
      let statusCode = 500
      if (result.error.includes("No poses found")) {
        statusCode = 404
      }
      
      return NextResponse.json({ error: result.error }, { status: statusCode })
    }
    
    return NextResponse.json(result)
  } catch (error: any) {
    console.error("API Route: Unhandled error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to generate sequence" },
      { status: 500 }
    )
  }
} 