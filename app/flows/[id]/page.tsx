import { createServerSupabaseClient } from "@/lib/supabase"
import { notFound } from "next/navigation"
import { SequenceEditor } from "./components/sequence-editor"
import { Metadata } from "next"

// This helps Next.js understand the params structure
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  return {
    title: `Flow ${params.id}`,
  }
}

// Use a different approach to handle the params
export default async function FlowPage(props: { params: { id: string } }) {
  try {
    // Access id directly from props to avoid the warning
    const flowId = props.params.id
    const supabase = createServerSupabaseClient()

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
    console.log("Flow owner check:", { 
      userLoggedIn: !!session?.user,
      userIdInSession: session?.user?.id,
      sequenceUserId: sequence.user_id,
      isOwner
    })
    
    // Sort the poses by position
    sequence.sequence_poses.sort((a: any, b: any) => a.position - b.position)

    return (
      <div className="container py-6 md:py-10">
        <SequenceEditor sequence={sequence} isOwner={isOwner} />
      </div>
    )
  } catch (error) {
    console.error("Error in flow page:", error)
    return notFound()
  }
}

