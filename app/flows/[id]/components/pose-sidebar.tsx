"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useSupabase } from "@/components/providers"
import { formatCategory } from "@/lib/utils"
import { Search, Grip } from "lucide-react"

interface Pose {
  id: string
  english_name: string
  sanskrit_name: string | null
  category: string | null
  difficulty_level: string | null
  side_option: string | null
}

interface PoseSidebarProps {
  onPoseSelect: (pose: Pose) => void
}

export function PoseSidebar({ onPoseSelect }: PoseSidebarProps) {
  const { supabase } = useSupabase()
  const [poses, setPoses] = useState<Pose[]>([])
  const [filteredPoses, setFilteredPoses] = useState<Pose[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [draggedPose, setDraggedPose] = useState<Pose | null>(null)

  useEffect(() => {
    const fetchPoses = async () => {
      try {
        setIsLoading(true)
        const { data, error } = await supabase
          .from("poses")
          .select("*")
          .order("english_name")
        
        if (error) {
          console.error("Error fetching poses:", error)
          return
        }
        
        setPoses(data as Pose[])
        setFilteredPoses(data as Pose[])
        
        // Extract unique categories
        const uniqueCategories = Array.from(
          new Set(data.map((pose: Pose) => pose.category).filter(Boolean))
        ) as string[]
        
        setCategories(uniqueCategories)
      } catch (error) {
        console.error("Error in fetchPoses:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchPoses()
  }, [supabase])

  useEffect(() => {
    let result = poses

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (pose) =>
          pose.english_name.toLowerCase().includes(query) ||
          (pose.sanskrit_name && pose.sanskrit_name.toLowerCase().includes(query))
      )
    }

    // Filter by selected categories
    if (selectedCategories.length > 0) {
      result = result.filter((pose) => 
        pose.category && selectedCategories.includes(pose.category)
      )
    }

    setFilteredPoses(result)
  }, [searchQuery, selectedCategories, poses])

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    )
  }

  const handleDragStart = (e: React.DragEvent, pose: Pose) => {
    console.log("Drag started with pose:", pose.english_name);
    setDraggedPose(pose);
    
    // Set the drag data
    e.dataTransfer.setData("pose", JSON.stringify(pose));
    e.dataTransfer.setData("text/plain", pose.english_name);
    e.dataTransfer.effectAllowed = "copy";
    
    // Create a drag image
    const dragImage = document.createElement("div");
    dragImage.className = "bg-background border rounded-md p-2 shadow-md";
    dragImage.textContent = pose.english_name;
    document.body.appendChild(dragImage);
    dragImage.style.position = "absolute";
    dragImage.style.top = "-1000px";
    
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    
    // Clean up the drag image after a short delay
    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 100);
  }
  
  const handleDragEnd = () => {
    setDraggedPose(null);
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search poses..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Badge
            key={category}
            variant={selectedCategories.includes(category) ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => handleCategoryToggle(category)}
          >
            {formatCategory(category)}
          </Badge>
        ))}
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-muted-foreground">Loading poses...</div>
      ) : (
        <div className="space-y-2 max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
          {filteredPoses.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No poses found. Try adjusting your search.
            </div>
          ) : (
            filteredPoses.map((pose) => (
              <Card 
                key={pose.id} 
                className={`cursor-grab hover:bg-accent/50 transition-colors ${
                  draggedPose?.id === pose.id ? 'opacity-50' : ''
                }`}
                draggable
                onDragStart={(e) => handleDragStart(e, pose)}
                onDragEnd={handleDragEnd}
              >
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{pose.english_name}</div>
                    {pose.sanskrit_name && (
                      <div className="text-sm text-muted-foreground">{pose.sanskrit_name}</div>
                    )}
                    {pose.category && (
                      <Badge variant="outline" className="mt-1">
                        {formatCategory(pose.category)}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center">
                    <Grip className="h-4 w-4 text-muted-foreground mr-2" />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      onClick={() => onPoseSelect(pose)}
                    >
                      +
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
} 