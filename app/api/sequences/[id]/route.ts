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
    
    // Fetch sequence metadata
    const { data: sequence, error: sequenceError } = await supabase
      .from('sequences')
      .select('*')
      .eq('id', id)
      .single();

    if (sequenceError || !sequence) {
      console.log(`API: No sequence found with ID: ${id}`);
      return NextResponse.json({ error: 'Sequence not found' }, { status: 404 });
    }

    // Fetch phases
    const { data: phases, error: phasesError } = await supabase
      .from('sequence_phases')
      .select('*')
      .eq('sequence_id', id)
      .order('position');

    // Fetch poses for all phases
    const { data: poses, error: posesError } = await supabase
      .from('sequence_poses')
      .select('*, poses(*)')
      .eq('sequence_id', id)
      .order('phase_id, position');

    // Assemble phases with their poses
    const phasesWithPoses = (phases || []).map(phase => ({
      ...phase,
      poses: (poses || [])
        .filter(p => p.phase_id === phase.id)
        .map(p => ({
          id: p.id,
          pose_id: p.pose_id,
          name: p.poses?.english_name || p.poses?.name || 'Unknown Pose',
          sanskrit_name: p.poses?.sanskrit_name,
          duration_seconds: p.duration,
          side: p.side,
          side_option: p.side_option,
          cues: p.cues,
          position: p.position,
          image_url: p.poses?.image_url,
          transition: p.transition,
          breath_cue: p.breath_cue,
          modifications: p.modifications
        }))
    }));

    console.log(`API: Successfully retrieved sequence: ${id}`);
    return NextResponse.json({
      id: sequence.id,
      name: sequence.title,
      description: sequence.description,
      duration_minutes: sequence.duration,
      difficulty: sequence.difficulty_level,
      style: sequence.style,
      focus: sequence.focus_area,
      phases: phasesWithPoses,
      created_at: sequence.created_at,
      updated_at: sequence.updated_at,
      user_id: sequence.user_id,
      is_favorite: sequence.is_favorite || false,
      tags: sequence.tags || [],
      notes: sequence.notes || '',
      structureOnly: sequence.structureOnly || false
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`API: Uncaught error fetching sequence: ${errorMessage}`, error);
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    )
  }
} 