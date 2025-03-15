import { createServerSupabaseClient } from "@/lib/supabase"
import { notFound, redirect } from "next/navigation"
import { SequenceEditor } from "./components/sequence-editor"
import { PageContainer } from "@/components/page-container"

export default async function FlowPage({ params }: { params: { id: string } }) {
  // Store the ID in a variable to avoid the async params warning
  const flowId = params.id
  
  const supabase = createServerSupabaseClient()

  // Get the current user
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    // Redirect to login if not authenticated
    redirect(`/login?redirect=/flows/${flowId}`)
  }

  // Fetch the sequence with its poses
  const { data: sequence } = await supabase
    .from("sequences")
    .select(`
      *,
      sequence_poses (
        id,
        position,
        duration,
        side,
        cues,
        poses (*)
      )
    `)
    .eq("id", flowId)
    .eq("user_id", session.user.id)
    .single()

  if (!sequence) {
    notFound()
  }

  // Sort the poses by position
  sequence.sequence_poses.sort((a: any, b: any) => a.position - b.position)

  return (
    <PageContainer>
      <h1 className="text-3xl font-bold mb-2">{sequence.title}</h1>
      <p className="text-muted-foreground mb-8">{sequence.description}</p>

      <SequenceEditor sequence={sequence} />
    </PageContainer>
  )
}

