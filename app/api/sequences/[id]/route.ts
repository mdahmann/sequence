import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    // Properly await the params
    const { id } = context.params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Sequence ID is required' },
        { status: 400 }
      )
    }
    
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from('sequences')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Sequence not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching sequence:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 