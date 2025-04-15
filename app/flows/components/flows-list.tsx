"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Edit2, Trash2, Download, Loader2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { formatCategory } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"
import { useSupabase } from "@/components/providers"
import { useRouter } from "next/navigation"

interface SequencePose {
  id: string
  position: number
  poses: {
    id: string
    english_name: string
    sanskrit_name: string | null
    category: string | null
    difficulty_level: string | null
  }
}

interface Sequence {
  id: string
  title: string
  description: string | null
  duration: number | null
  difficulty_level: string | null
  style: string | null
  focus_area: string | null
  is_ai_generated: boolean | null
  created_at: string
  sequence_poses: SequencePose[]
}

interface FlowsListProps {
  sequences: Sequence[]
}

export function FlowsList() {
  const router = useRouter()
  const { supabase } = useSupabase()
  const [loading, setLoading] = useState(true)
  const [flows, setFlows] = useState<Sequence[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSequences = async () => {
      setLoading(true)
      setError(null)
      
      try {
        console.log("FlowsList: Checking auth state")
        // Get user session
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session || !session.user) {
          console.log("FlowsList: No session found, redirecting to login")
          router.push('/login?redirect=/flows')
          return
        }
        
        console.log("FlowsList: User authenticated:", session.user.email)
        
        // Fetch user's sequences
        const { data: sequences, error } = await supabase
          .from("sequences")
          .select(`
            *,
            sequence_poses (
              id,
              position,
              poses (
                id,
                english_name,
                sanskrit_name,
                category,
                difficulty_level
              )
            )
          `)
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false })
        
        if (error) {
          throw error
        }
        
        setFlows(sequences || [])
      } catch (error: any) {
        console.error("Error fetching sequences:", error)
        setError(error.message || "Failed to load sequences")
        toast({
          title: "Error",
          description: "Failed to load your sequences",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchSequences()
  }, [supabase, router])

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("sequences").delete().eq("id", id)

      if (error) throw error

      setFlows(flows.filter((item) => item.id !== id))
      toast({
        title: "Success",
        description: "Sequence deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting sequence:", error)
      toast({
        title: "Error",
        description: "Failed to delete sequence",
        variant: "destructive",
      })
    }
  }

  const handleExport = async (sequence: Sequence) => {
    // Create a simple text representation of the sequence
    let content = `${sequence.title}\n${sequence.description || ""}\n\n`
    content += `Duration: ${sequence.duration} minutes\n`
    content += `Difficulty: ${sequence.difficulty_level}\n`
    content += `Style: ${sequence.style}\n`
    content += `Focus: ${formatCategory(sequence.focus_area)}\n\n`

    // Sort poses by position
    const sortedPoses = [...sequence.sequence_poses].sort((a, b) => a.position - b.position)

    sortedPoses.forEach((item, index) => {
      content += `${index + 1}. ${item.poses.english_name} (${item.poses.sanskrit_name || "No Sanskrit name"})\n`
    })

    // Create a download link
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${sequence.title.replace(/\s+/g, "_")}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Success",
      description: "Sequence exported successfully",
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2">Loading your flows...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-serif font-normal mb-4">Error loading flows</h3>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={() => router.refresh()}>Try Again</Button>
      </div>
    )
  }

  if (flows.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-serif font-normal mb-4">You don't have any saved flows yet</h3>
        <p className="text-muted-foreground mb-6">Generate a new sequence or create one from scratch to get started.</p>
        <Button asChild>
          <Link href="/generate">Generate a Sequence</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {flows.map((sequence) => (
        <Card key={sequence.id} className="flex flex-col">
          <CardContent className="pt-6 flex-grow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-serif font-normal text-lg">{sequence.title}</h3>
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>{sequence.duration} min</span>
                </div>
              </div>
              <div className="flex space-x-1">
                <Badge variant={sequence.is_ai_generated ? "default" : "outline"}>
                  {sequence.is_ai_generated ? "AI Generated" : "Custom"}
                </Badge>
                <Badge variant="outline">{formatCategory(sequence.difficulty_level)}</Badge>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-4">{sequence.description}</p>

            <div className="text-sm">
              <div className="font-medium">
                Style: <span className="font-normal">{formatCategory(sequence.style)}</span>
              </div>
              <div className="font-medium">
                Focus: <span className="font-normal">{formatCategory(sequence.focus_area)}</span>
              </div>
              <div className="font-medium">
                Poses: <span className="font-normal">{sequence.sequence_poses?.length || 0}</span>
              </div>
              <div className="font-medium mt-2 text-xs text-muted-foreground">
                Created {formatDistanceToNow(new Date(sequence.created_at), { addSuffix: true })}
              </div>
            </div>
          </CardContent>

          <CardFooter className="border-t pt-4 flex justify-between">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/edit/${sequence.id}`}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>

            <div className="flex space-x-2">
              <Button variant="ghost" size="sm" onClick={() => handleExport(sequence)}>
                <Download className="h-4 w-4" />
                <span className="sr-only">Export</span>
              </Button>

              <Button variant="ghost" size="sm" onClick={() => handleDelete(sequence.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
                <span className="sr-only">Delete</span>
              </Button>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

