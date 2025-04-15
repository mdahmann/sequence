"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/providers"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Edit, ArrowLeft } from "lucide-react"

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
          setIsOwner(session.user.id === sequence.user_id)
        } else {
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/flows')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Flows
        </Button>
        
        {isOwner && (
          <Button 
            onClick={() => router.push(`/edit/${sequence.id}`)}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit Flow
          </Button>
        )}
      </div>
      
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">{sequence.title || "Untitled Flow"}</h1>
        {sequence.description && (
          <p className="text-muted-foreground">{sequence.description}</p>
        )}
        
        <div className="grid grid-cols-1 gap-4 mt-6">
          {sequence.sequence_poses.map((item: any) => (
            <div key={item.id} className="flex items-center gap-3 p-3 border rounded-md">
              <div className="flex-1">
                <h3 className="font-medium">{item.poses?.english_name || "Unknown Pose"}</h3>
                {item.poses?.sanskrit_name && (
                  <p className="text-sm text-muted-foreground">{item.poses.sanskrit_name}</p>
                )}
              </div>
              {item.side && (
                <div className="text-sm px-2 py-1 bg-muted rounded-md">
                  {item.side}
                </div>
              )}
              {item.duration && (
                <div className="text-sm text-muted-foreground">
                  {item.duration}s
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}