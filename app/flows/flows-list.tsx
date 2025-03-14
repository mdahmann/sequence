"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Edit2, Trash2, Download } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import type { Database } from "@/types/supabase"

type SequenceWithPoses = Database["public"]["Tables"]["sequences"]["Row"] & {
  sequence_poses: Array<{
    id: string
    position: number
    poses: Database["public"]["Tables"]["poses"]["Row"]
  }>
}

export function FlowsList({ sequences }: { sequences: SequenceWithPoses[] }) {
  const [items, setItems] = useState(sequences)

  const handleDelete = async (id: string) => {
    // Implement delete functionality
    // This would call a server action to delete the sequence
    setItems(items.filter((item) => item.id !== id))
  }

  const handleExport = async (sequence: SequenceWithPoses) => {
    // Implement export functionality
    // This would generate a PDF or text export of the sequence
    alert("Export functionality will be implemented in a future update")
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-medium mb-4">You don't have any saved flows yet</h3>
        <p className="text-muted-foreground mb-6">Generate a new sequence or create one from scratch to get started.</p>
        <Button asChild>
          <Link href="/generate">Generate a Sequence</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((sequence) => (
        <Card key={sequence.id} className="flex flex-col">
          <CardContent className="pt-6 flex-grow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg">{sequence.title}</h3>
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>{sequence.duration} min</span>
                </div>
              </div>
              <div className="flex space-x-1">
                <Badge variant={sequence.is_ai_generated ? "default" : "outline"}>
                  {sequence.is_ai_generated ? "AI Generated" : "Custom"}
                </Badge>
                <Badge variant="outline">{sequence.difficulty_level}</Badge>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-4">{sequence.description}</p>

            <div className="text-sm">
              <div className="font-medium">
                Style: <span className="font-normal">{sequence.style}</span>
              </div>
              <div className="font-medium">
                Focus: <span className="font-normal">{sequence.focus_area?.replace("_", " ")}</span>
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
              <Link href={`/flows/${sequence.id}`}>
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

