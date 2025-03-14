"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { restrictToVerticalAxis, restrictToWindowEdges } from "@dnd-kit/modifiers"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SortablePoseItem } from "./sortable-pose-item"
import { Download, Save } from "lucide-react"
import { useSupabase } from "@/components/providers"
import type { Database } from "@/types/supabase"

type SequencePose = {
  id: string
  position: number
  duration: number | null
  side: string | null
  cues: string | null
  poses: Database["public"]["Tables"]["poses"]["Row"]
}

type Sequence = Database["public"]["Tables"]["sequences"]["Row"] & {
  sequence_poses: SequencePose[]
}

export function SequenceEditor({ sequence }: { sequence: Sequence }) {
  const router = useRouter()
  const { supabase } = useSupabase()
  const [items, setItems] = useState(sequence.sequence_poses)
  const [isSaving, setIsSaving] = useState(false)

  // Set up DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragEnd = (event: any) => {
    const { active, over } = event

    if (active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)

        return arrayMove(items, oldIndex, newIndex).map((item, index) => ({
          ...item,
          position: index * 10, // Update positions to maintain order
        }))
      })
    }
  }

  const handleCueChange = (id: string, cues: string) => {
    setItems(items.map((item) => (item.id === id ? { ...item, cues } : item)))
  }

  const handleSideChange = (id: string, side: string) => {
    setItems(items.map((item) => (item.id === id ? { ...item, side } : item)))
  }

  const handleDurationChange = (id: string, duration: number) => {
    setItems(items.map((item) => (item.id === id ? { ...item, duration } : item)))
  }

  const handleSave = async () => {
    setIsSaving(true)

    try {
      // Update each sequence pose with new position, cues, etc.
      const updates = items.map((item) => ({
        id: item.id,
        position: item.position,
        duration: item.duration,
        side: item.side,
        cues: item.cues,
      }))

      for (const update of updates) {
        await supabase.from("sequence_poses").update(update).eq("id", update.id)
      }

      router.refresh()
    } catch (error) {
      console.error("Error saving sequence:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleExport = async () => {
    // Create a simple text representation of the sequence
    let content = `${sequence.title}\n${sequence.description}\n\n`
    content += `Duration: ${sequence.duration} minutes\n`
    content += `Difficulty: ${sequence.difficulty_level}\n`
    content += `Style: ${sequence.style}\n`
    content += `Focus: ${sequence.focus_area}\n\n`

    items.forEach((item, index) => {
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
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 mb-4">
        <Badge>{sequence.difficulty_level}</Badge>
        <Badge variant="outline">{sequence.style}</Badge>
        <Badge variant="outline">{sequence.duration} min</Badge>
        <Badge variant="outline">{sequence.focus_area?.replace("_", " ")}</Badge>
      </div>

      <div className="flex justify-between mb-6">
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export Sequence
        </Button>

        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
      >
        <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {items.map((item) => (
              <SortablePoseItem
                key={item.id}
                id={item.id}
                pose={item.poses}
                cues={item.cues || ""}
                side={item.side || ""}
                duration={item.duration || 30}
                onCueChange={(cues) => handleCueChange(item.id, cues)}
                onSideChange={(side) => handleSideChange(item.id, side)}
                onDurationChange={(duration) => handleDurationChange(item.id, duration)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}

