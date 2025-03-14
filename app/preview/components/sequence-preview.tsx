"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { formatCategory } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"

interface SequencePose {
  id: string
  position: number
  duration: number | null
  side: string | null
  cues: string | null
  poses: {
    id: string
    english_name: string
    sanskrit_name: string | null
    category: string | null
    difficulty_level: string | null
    side_option: string | null
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

interface SequencePreviewProps {
  sequence: Sequence
}

export function SequencePreview({ sequence }: SequencePreviewProps) {
  const handleExport = async () => {
    // Create a simple text representation of the sequence
    let content = `${sequence.title}\n${sequence.description || ""}\n\n`
    content += `Duration: ${sequence.duration} minutes\n`
    content += `Difficulty: ${formatCategory(sequence.difficulty_level)}\n`
    content += `Style: ${formatCategory(sequence.style)}\n`
    content += `Focus: ${formatCategory(sequence.focus_area)}\n\n`

    sequence.sequence_poses.forEach((item, index) => {
      content += `${index + 1}. ${item.poses.english_name} (${item.poses.sanskrit_name || "No Sanskrit name"})\n`
      if (item.duration) content += `   Duration: ${item.duration} seconds\n`
      if (item.side) content += `   Side: ${item.side}\n`
      if (item.cues) content += `   Cues: ${item.cues}\n`
      content += "\n"
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 mb-4">
        <Badge>{formatCategory(sequence.difficulty_level)}</Badge>
        <Badge variant="outline">{formatCategory(sequence.style)}</Badge>
        <Badge variant="outline">{sequence.duration} min</Badge>
        <Badge variant="outline">{formatCategory(sequence.focus_area)}</Badge>
      </div>

      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export Sequence
        </Button>
        
        <Link href="/generate">
          <Button>Create Your Own</Button>
        </Link>
      </div>

      <div className="space-y-6">
        {sequence.sequence_poses.map((item, index) => (
          <div key={item.id} className="bg-card border rounded-lg p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="h-6 w-6 flex items-center justify-center p-0">
                  {index + 1}
                </Badge>
                <h3 className="text-lg font-medium">{item.poses.english_name}</h3>
                {item.poses.sanskrit_name && (
                  <span className="text-sm text-muted-foreground italic">({item.poses.sanskrit_name})</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {item.duration && <Badge variant="secondary">{item.duration}s</Badge>}
                {item.side && <Badge variant="outline">{item.side}</Badge>}
                {item.poses.category && <Badge variant="outline">{formatCategory(item.poses.category)}</Badge>}
              </div>
            </div>
            {item.cues && <p className="text-muted-foreground">{item.cues}</p>}
          </div>
        ))}
      </div>
      
      <div className="mt-8 border-t pt-6 text-center">
        <p className="text-muted-foreground mb-4">
          This is a preview of an AI-generated yoga sequence. Create your own personalized sequence now!
        </p>
        <Link href="/generate">
          <Button size="lg">
            Create Your Own Sequence
          </Button>
        </Link>
      </div>
    </div>
  )
} 