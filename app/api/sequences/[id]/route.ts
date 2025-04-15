import { NextResponse, NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const id = params.id;
    if (!id) {
      return NextResponse.json(
        { error: 'Sequence ID is required' },
        { status: 400 }
      )
    }
    // Secure Supabase client with cookies from NextRequest
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set() {},
          remove() {},
        },
      }
    )
    // Fetch sequence metadata
    const { data: sequence, error: sequenceError } = await supabase
      .from('sequences')
      .select('*')
      .eq('id', id)
      .single();
    if (sequenceError || !sequence) {
      return NextResponse.json({ error: 'Sequence not found' }, { status: 404 });
    }
    // Fetch phases
    const { data: phases } = await supabase
      .from('sequence_phases')
      .select('*')
      .eq('sequence_id', id)
      .order('position');
    // Fetch poses for all phases
    const { data: poses } = await supabase
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
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const id = params.id;
    if (!id) {
      console.error('PATCH: No sequence ID provided');
      return NextResponse.json(
        { error: 'Sequence ID is required' },
        { status: 400 }
      );
    }
    // Secure Supabase client with cookies from NextRequest
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set() {},
          remove() {},
        },
      }
    )
    const { data: { session } } = await supabase.auth.getSession();
    console.log('PATCH: Session:', session);
    if (!session?.user) {
      console.error('PATCH: No authenticated user found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    // Verify user has access to this sequence
    const { data: sequence, error: sequenceError } = await supabase
      .from('sequences')
      .select('user_id')
      .eq('id', id)
      .single();
    console.log('PATCH: Sequence from DB:', sequence);
    if (sequenceError) {
      console.error('PATCH: Sequence fetch error:', sequenceError);
    }
    if (sequenceError || !sequence) {
      return NextResponse.json(
        { error: 'Sequence not found' },
        { status: 404 }
      );
    }
    if (sequence.user_id !== session.user.id) {
      console.error('PATCH: User not authorized. Sequence user_id:', sequence.user_id, 'Session user id:', session.user.id);
      return NextResponse.json(
        { error: 'Not authorized to update this sequence' },
        { status: 403 }
      );
    }
    const updates = await request.json();
    console.log('PATCH: Incoming update payload:', updates);
    if (!updates) {
      console.error('PATCH: No update data provided');
      return NextResponse.json(
        { error: 'No update data provided' },
        { status: 400 }
      );
    }
    const hasPhaseUpdates = updates.phases && Array.isArray(updates.phases);
    try {
      const { error: updateError } = await supabase
        .from('sequences')
        .update({
          title: updates.name,
          description: updates.description,
          duration: updates.duration_minutes,
          difficulty_level: updates.difficulty,
          style: updates.style,
          focus_area: updates.focus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      if (updateError) {
        console.error('PATCH: Failed to update sequence:', updateError);
        throw new Error(`Failed to update sequence: ${updateError.message}`);
      }
      if (hasPhaseUpdates) {
        for (const phase of updates.phases) {
          if (!phase.id) continue;
          const { error: phaseUpdateError } = await supabase
            .from('sequence_phases')
            .update({
              name: phase.name,
              description: phase.description,
              position: phase.position,
              duration_minutes: phase.duration_minutes,
              updated_at: new Date().toISOString()
            })
            .eq('id', phase.id)
            .eq('sequence_id', id);
          if (phaseUpdateError) {
            console.error(`PATCH: Failed to update phase ${phase.id}:`, phaseUpdateError);
            throw new Error(`Failed to update phase ${phase.id}: ${phaseUpdateError.message}`);
          }
          if (phase.poses && Array.isArray(phase.poses)) {
            for (const pose of phase.poses) {
              if (!pose.id) continue;
              const { error: poseUpdateError } = await supabase
                .from('sequence_poses')
                .update({
                  position: pose.position,
                  duration: pose.duration_seconds,
                  side: pose.side,
                  side_option: pose.side_option,
                  cues: pose.cues,
                  transition: pose.transition,
                  breath_cue: pose.breath_cue,
                  modifications: Array.isArray(pose.modifications) ? pose.modifications : null,
                  updated_at: new Date().toISOString()
                })
                .eq('id', pose.id)
                .eq('sequence_id', id);
              if (poseUpdateError) {
                console.error(`PATCH: Failed to update pose ${pose.id}:`, poseUpdateError);
                throw new Error(`Failed to update pose ${pose.id}: ${poseUpdateError.message}`);
              }
            }
          }
        }
      }
      console.log('PATCH: Sequence update successful for id:', id);
      return NextResponse.json({ success: true, id });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('PATCH: Error updating sequence:', errorMessage, error);
      return NextResponse.json(
        { error: 'Failed to update sequence', details: errorMessage },
        { status: 500 }
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('PATCH: Uncaught error updating sequence:', errorMessage, error);
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
} 