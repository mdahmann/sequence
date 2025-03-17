import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

interface Pose {
  id: string
  name: string
  sanskrit_name: string | null
  category: string | null
  difficulty: string | null
  side_option: boolean
  image_url?: string
}

interface PoseSidebarProps {
  onPoseSelect: (pose: Pose) => void
}

export function PoseSidebar({ onPoseSelect }: PoseSidebarProps) {
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
        // For beta, use sample poses
        const samplePoses: Pose[] = [
          {
            id: "1",
            name: "Mountain Pose",
            sanskrit_name: "Tadasana",
            category: "standing",
            difficulty: "beginner",
            side_option: false,
            image_url: "/poses/mountain.jpg"
          },
          {
            id: "2",
            name: "Downward-Facing Dog",
            sanskrit_name: "Adho Mukha Svanasana",
            category: "arm_balance",
            difficulty: "beginner",
            side_option: false,
            image_url: "/poses/downdog.jpg"
          },
          {
            id: "3",
            name: "Warrior I",
            sanskrit_name: "Virabhadrasana I",
            category: "standing",
            difficulty: "intermediate",
            side_option: true,
            image_url: "/poses/warrior1.jpg"
          },
          // Add more sample poses as needed
        ]
        
        setPoses(samplePoses)
        setFilteredPoses(samplePoses)
        
        // Extract unique categories
        const uniqueCategories = Array.from(
          new Set(samplePoses.map(pose => pose.category).filter(Boolean))
        ) as string[]
        
        setCategories(uniqueCategories)
      } catch (error) {
        console.error("Error in fetchPoses:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchPoses()
  }, [])

  useEffect(() => {
    let result = poses

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (pose) =>
          pose.name.toLowerCase().includes(query) ||
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

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, pose: Pose) => {
    setDraggedPose(pose)
    e.dataTransfer.setData("pose", JSON.stringify(pose))
    e.dataTransfer.effectAllowed = "copy"
  }
  
  const handleDragEnd = () => {
    setDraggedPose(null)
  }

  const formatCategory = (category: string | null) => {
    if (!category) return ""
    return category
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      <div className="relative mb-4">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search poses..."
          className="pl-8"
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
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
        <div className="flex-1 overflow-y-auto pr-2 space-y-1">
          {filteredPoses.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No poses found. Try adjusting your search.
            </div>
          ) : (
            filteredPoses.map((pose) => (
              <div
                key={pose.id}
                className={cn(
                  "rounded-md p-3 cursor-grab hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
                  draggedPose?.id === pose.id && "opacity-50 bg-gray-100 dark:bg-gray-800"
                )}
                draggable
                onDragStart={(e) => handleDragStart(e, pose)}
                onDragEnd={handleDragEnd}
                onClick={() => onPoseSelect(pose)}
              >
                <div className="font-medium">{pose.name}</div>
                {pose.sanskrit_name && (
                  <div className="text-sm text-muted-foreground">{pose.sanskrit_name}</div>
                )}
                <div className="flex flex-wrap gap-1 mt-1">
                  {pose.category && (
                    <Badge variant="outline" className="text-xs">
                      {formatCategory(pose.category)}
                    </Badge>
                  )}
                  {pose.side_option && (
                    <Badge variant="outline" className="text-xs">
                      Has sides
                    </Badge>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
} 