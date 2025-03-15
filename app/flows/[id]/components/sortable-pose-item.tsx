"use client"

import React, { useState } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { GripVertical, Sparkles, Info } from "lucide-react"
import { formatCategory } from "@/lib/utils"
import { useGenerateCues } from "@/hooks/use-generate-cues"

interface Pose {
  id: string
  english_name: string
  sanskrit_name: string | null
  category: string | null
  difficulty_level: string | null
  side_option: string | null
}

interface SortablePoseItemProps {
  id: string
  pose: Pose
  cues: string
  side: string
  duration: number
  onCueChange: (cues: string) => void
  onSideChange: (side: string) => void
  onDurationChange: (duration: number) => void
  isEditable?: boolean
}

export function SortablePoseItem({
  id,
  pose,
  cues,
  side,
  duration,
  onCueChange,
  onSideChange,
  onDurationChange,
  isEditable = true,
}: SortablePoseItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const [isEditingCues, setIsEditingCues] = useState(false)
  const [localCues, setLocalCues] = useState(cues)
  const { generateCues, isLoading: isGeneratingCues } = useGenerateCues()

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleCueChange = (value: string) => {
    setLocalCues(value)
  }

  const saveCues = () => {
    onCueChange(localCues)
    setIsEditingCues(false)
  }

  const handleDurationChange = (value: number[]) => {
    onDurationChange(value[0])
  }

  const handleGenerateCues = async () => {
    try {
      const generatedCues = await generateCues({
        poseId: pose.id,
        side,
        existingCues: localCues,
      })
      if (generatedCues) {
        setLocalCues(generatedCues)
        onCueChange(generatedCues)
      }
    } catch (error) {
      console.error("Error generating cues:", error)
    }
  }

  // Check if this pose has a side option (left/right)
  const hasSideOption = pose.side_option === "left_right" || pose.side_option === "both"

  // Determine if we should show the left/right indicators
  const showSideIndicator = side === "left" || side === "right"

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <Card className={`border ${showSideIndicator ? (side === "left" ? "bg-blue-50/50" : "bg-orange-50/50") : ""}`}>
        {showSideIndicator && (
          <div className={`absolute top-2 left-2 flex items-center justify-center w-6 h-6 rounded-full ${side === "left" ? "bg-blue-100 text-blue-600" : "bg-orange-100 text-orange-600"}`}>
            {side === "left" ? "L" : "R"}
          </div>
        )}
        
        <CardContent className="pt-6 pb-4">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center">
                <span className="text-xs text-muted-foreground mr-2">Pose</span>
                <h3 className="font-medium">{pose.english_name}</h3>
              </div>
              {pose.sanskrit_name && (
                <p className="text-xs text-muted-foreground italic">{pose.sanskrit_name}</p>
              )}
            </div>
            
            <div className="flex items-center">
              <span className="text-xs text-muted-foreground mr-2">{duration}s</span>
              {isEditable && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => {}}
                >
                  <Info className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            {isEditable && (
              <div
                {...attributes}
                {...listeners}
                className="absolute top-2 right-2 cursor-grab active:cursor-grabbing"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
          </div>

          {isEditable && (
            <>
              {/* Duration slider */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-medium">Duration</label>
                  <span className="text-xs text-muted-foreground">{duration} seconds</span>
                </div>
                <Slider
                  value={[duration]}
                  min={5}
                  max={120}
                  step={5}
                  onValueChange={handleDurationChange}
                />
              </div>

              {/* Side selection */}
              {hasSideOption && (
                <div className="mb-4">
                  <label className="text-xs font-medium block mb-1">Side</label>
                  <Select value={side} onValueChange={onSideChange}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Select side" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Both/Center</SelectItem>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Cues */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-medium">Cues</label>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => setIsEditingCues(!isEditingCues)}
                    >
                      {isEditingCues ? "Cancel" : "Edit"}
                    </Button>
                    {isEditingCues && (
                      <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={saveCues}>
                        Save
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={handleGenerateCues}
                      disabled={isGeneratingCues}
                    >
                      {isGeneratingCues ? "..." : "Generate"}
                      <Sparkles className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                </div>
                {isEditingCues ? (
                  <Textarea
                    value={localCues}
                    onChange={(e) => handleCueChange(e.target.value)}
                    placeholder="Enter cues for this pose..."
                    className="min-h-[80px] text-sm"
                  />
                ) : (
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                    {cues || "No cues provided."}
                  </p>
                )}
              </div>
            </>
          )}

          {!isEditable && (
            <>
              {hasSideOption && side && (
                <div className="mb-2">
                  <span className="text-xs font-medium">Side: </span>
                  <span className="text-xs">{side || "Both/Center"}</span>
                </div>
              )}
              
              <div>
                <span className="text-xs font-medium">Cues: </span>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap mt-1">
                  {cues || "No cues provided."}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

