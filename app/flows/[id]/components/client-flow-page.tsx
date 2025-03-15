"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { SequenceEditor } from "./sequence-editor"
import { useSupabase } from "@/components/providers"
import { Loader2 } from "lucide-react"

interface ClientFlowPageProps {
  sequence: any
  initialIsOwner: boolean
}

export function ClientFlowPage({ sequence, initialIsOwner }: ClientFlowPageProps) {
  const router = useRouter()
  const { supabase } = useSupabase()
  const [isOwner, setIsOwner] = useState(initialIsOwner)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          console.log("Client flow page: User authenticated", {
            userEmail: session.user.email,
            userId: session.user.id,
            sequenceUserId: sequence.user_id,
            isOwner: session.user.id === sequence.user_id
          })
          
          setIsOwner(session.user.id === sequence.user_id)
        } else {
          console.log("Client flow page: No authenticated user")
          setIsOwner(false)
        }
      } catch (error) {
        console.error("Error checking auth:", error)
        setIsOwner(false)
      } finally {
        setIsLoading(false)
      }
    }
    
    checkAuth()
  }, [supabase, sequence.user_id])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2">Loading...</span>
      </div>
    )
  }

  return <SequenceEditor sequence={sequence} isOwner={isOwner} />
} 