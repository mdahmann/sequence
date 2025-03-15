import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  return NextResponse.json({ status: "ok", message: "Debug endpoint is working" })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    return NextResponse.json({ 
      status: "ok", 
      message: "Debug endpoint received POST request", 
      receivedData: body 
    })
  } catch (error: any) {
    return NextResponse.json({ 
      status: "error", 
      message: error.message || "Failed to parse request body" 
    }, { status: 400 })
  }
} 