import { createServerSupabaseClient } from "@/lib/supabase"
import { notFound, redirect } from "next/navigation"
import { SequenceEditor } from "./components/sequence-editor"

export default async function FlowPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()

  // Get the current user
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    // Redirect to login if not authenticated
    redirect(`/login?redirect=/flows/${params.id}`)
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
    .eq("id", params.id)
    .eq("user_id", session.user.id)
    .single()

  if (!sequence) {
    notFound()
  }

  // Sort the poses by position
  sequence.sequence_poses.sort((a, b) => a.position - b.position)

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">{sequence.title}</h1>
      <p className="text-muted-foreground mb-8">{sequence.description}</p>

      <SequenceEditor sequence={sequence} />
    </div>
  )
}

