import { createServerSupabaseClient } from "@/lib/supabase"
import { notFound } from "next/navigation"
import { ClientFlowPage } from "./components/client-flow-page"

interface PageParams {
  params: {
    id: string
  }
}

export default async function FlowPage({ params }: PageParams) {
  try {
    // Properly destructure the ID to avoid the Next.js warning
    const { id } = params
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
      .eq("id", id)
      .single()

    if (error || !sequence) {
      console.error("Error fetching sequence:", error)
      return notFound()
    }

    // Check if the user owns this sequence or if it's a shared sequence
    const initialIsOwner = session?.user?.id === sequence.user_id
    console.log("Server Flow owner check:", { 
      userLoggedIn: !!session?.user,
      userEmail: session?.user?.email,
      userIdInSession: session?.user?.id,
      sequenceUserId: sequence.user_id,
      isOwner: initialIsOwner
    })
    
    // Sort the poses by position
    sequence.sequence_poses.sort((a: any, b: any) => a.position - b.position)

    return (
      <div className="container py-6 md:py-10">
        <ClientFlowPage sequence={sequence} initialIsOwner={initialIsOwner} />
      </div>
    )
  } catch (error) {
    console.error("Error in flow page:", error)
    return notFound()
  }
}

