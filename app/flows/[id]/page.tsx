import { createServerSupabaseClient } from "@/lib/supabase"
import { notFound } from "next/navigation"
import { SequenceEditor } from "./components/sequence-editor"
import { PageContainer } from "@/components/page-container"

export default async function FlowPage({ params }: { params: { id: string } }) {
  // Store the ID in a variable to avoid the Next.js warning
  const flowId = params.id
  const supabase = createServerSupabaseClient()

  try {
    // Get the current user
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Fetch the sequence with its poses - don't filter by user_id to allow viewing shared sequences
    const { data: sequence, error } = await supabase
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
      .single()

    if (error || !sequence) {
      console.error("Error fetching sequence:", error)
      return notFound()
    }

    // Check if the user owns this sequence or if it's a shared sequence
    const isOwner = session?.user?.id === sequence.user_id
    
    // Sort the poses by position
    sequence.sequence_poses.sort((a: any, b: any) => a.position - b.position)

    return (
      <PageContainer>
        <h1 className="text-3xl font-bold mb-2">{sequence.title}</h1>
        <p className="text-muted-foreground mb-8">{sequence.description}</p>

        <SequenceEditor sequence={sequence} isOwner={isOwner} />
      </PageContainer>
    )
  } catch (error) {
    console.error("Error in flow page:", error)
    return notFound()
  }
}

