import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Fully await the params object before destructuring
    const params = await context.params;
    const id = params.id;
    
    console.log(`API: Fetching sequence with ID: ${id}`);
    
    if (!id) {
      console.log('API: No ID provided');
      return NextResponse.json(
        { error: 'Sequence ID is required' },
        { status: 400 }
      )
    }
    
    const supabase = createServerSupabaseClient()
    console.log(`API: Supabase client created, querying for sequence ID: ${id}`);
    
    const { data, error } = await supabase
      .from('sequences')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.log(`API: Error fetching sequence: ${error.message}`, error);
      return NextResponse.json(
        { error: 'Sequence not found', details: error.message },
        { status: 404 }
      )
    }

    if (!data) {
      console.log(`API: No sequence found with ID: ${id}`);
      return NextResponse.json(
        { error: 'Sequence not found', details: 'No data returned' },
        { status: 404 }
      )
    }

    console.log(`API: Successfully retrieved sequence: ${id}`);
    return NextResponse.json(data)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`API: Uncaught error fetching sequence: ${errorMessage}`, error);
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    )
  }
} 