"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Plus } from "lucide-react"
import { useSupabase } from "@/components/providers"
import { cn } from "@/lib/utils"

interface Pose {
  id: string
  english_name?: string
  name?: string
  sanskrit_name?: string
  category?: string
  difficulty_level?: string
  difficulty?: string
}

interface PoseSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onPoseSelect: (pose: Pose) => void
  title?: string
}

export function PoseSelectionModal({
  isOpen,
  onClose,
  onPoseSelect,
  title = "Select a Pose"
}: PoseSelectionModalProps) {
  const { supabase } = useSupabase()
  const [poses, setPoses] = useState<Pose[]>([])
  const [filteredPoses, setFilteredPoses] = useState<Pose[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPoses = async () => {
      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from("poses")
          .select("*")
          .order("english_name")
        
        if (error) throw error
        
        // Normalize pose data
        const normalizedPoses = data?.map(pose => ({
          id: pose.id,
          name: pose.english_name,
          english_name: pose.english_name,
          sanskrit_name: pose.sanskrit_name,
          category: pose.category,
          difficulty: pose.difficulty_level,
          difficulty_level: pose.difficulty_level
        })) || []
        
        setPoses(normalizedPoses)
        setFilteredPoses(normalizedPoses)
      } catch (error) {
        console.error("Error fetching poses:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (isOpen) {
      fetchPoses()
    }
  }, [supabase, isOpen])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredPoses(poses)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = poses.filter(
      (pose) =>
        (pose.name?.toLowerCase().includes(query) || pose.english_name?.toLowerCase().includes(query)) ||
        (pose.sanskrit_name && pose.sanskrit_name.toLowerCase().includes(query)) ||
        (pose.category && pose.category.toLowerCase().includes(query))
    )
    setFilteredPoses(filtered)
  }, [searchQuery, poses])

  const handlePoseSelect = (pose: Pose) => {
    onPoseSelect(pose)
    onClose()
  }
  
  const formatCategory = (category: string | null | undefined) => {
    if (!category) return ""
    return category
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <div className="relative mb-4">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search poses..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <p>Loading poses...</p>
            </div>
          ) : filteredPoses.length === 0 ? (
            <div className="flex justify-center items-center h-40">
              <p>No poses found matching "{searchQuery}"</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPoses.map((pose) => (
                <Card 
                  key={pose.id} 
                  className={cn(
                    "cursor-pointer hover:border-primary transition-colors",
                    "hover:bg-gray-50 dark:hover:bg-gray-800"
                  )}
                  onClick={() => handlePoseSelect(pose)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{pose.name || pose.english_name}</h3>
                        {pose.sanskrit_name && (
                          <p className="text-xs text-muted-foreground italic">{pose.sanskrit_name}</p>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => {
                        e.stopPropagation()
                        handlePoseSelect(pose)
                      }}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {pose.category && (
                        <Badge variant="outline" className="text-xs">
                          {formatCategory(pose.category)}
                        </Badge>
                      )}
                      {(pose.difficulty || pose.difficulty_level) && (
                        <Badge variant="outline" className="text-xs">
                          {formatCategory(pose.difficulty || pose.difficulty_level)}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 