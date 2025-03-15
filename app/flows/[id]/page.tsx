import { createServerSupabaseClient } from "@/lib/supabase"
import { notFound } from "next/navigation"
import { SequenceEditor } from "./components/sequence-editor"

export default async function FlowPage({ params }: { params: { id: string } }) {
  try {
    // Store the ID in a variable to avoid the Next.js warning
    const flowId = params.id
    console.log("FlowPage: Loading sequence with ID:", flowId)
    
    const supabase = createServerSupabaseClient()

    // Get the current user
    const {
      data: { session },
    } = await supabase.auth.getSession()

    console.log("FlowPage: User authenticated:", session?.user?.email || "No user")

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

    if (error) {
      console.error("FlowPage: Error fetching sequence:", error)
      return notFound()
    }

    if (!sequence) {
      console.error("FlowPage: Sequence not found")
      return notFound()
    }

    console.log("FlowPage: Sequence loaded:", sequence.title)
    console.log("FlowPage: Sequence poses:", sequence.sequence_poses?.length || 0)

    // Check if the user owns this sequence or if it's a shared sequence
    const isOwner = session?.user?.id === sequence.user_id
    console.log("FlowPage: User is owner:", isOwner)
    
    // Ensure sequence_poses is an array
    if (!sequence.sequence_poses || !Array.isArray(sequence.sequence_poses)) {
      console.error("FlowPage: sequence_poses is not an array")
      sequence.sequence_poses = []
    }
    
    // Sort the poses by position
    sequence.sequence_poses.sort((a: any, b: any) => (a.position || 0) - (b.position || 0))

    return (
      <div className="container py-6 md:py-10">
        <SequenceEditor sequence={sequence} isOwner={isOwner} />
      </div>
    )
  } catch (error) {
    console.error("FlowPage: Unhandled error:", error)
    return notFound()
  }
}

