import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, ChevronDown, ChevronUp, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSupabase } from "@/components/providers"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui-enhanced/loading-spinner"

interface Pose {
  id: string
  name: string
  sanskrit_name: string | null
  category: string | null
  difficulty: string | null
  difficulty_level?: string | null
  side_option: string | null | boolean
  image_url?: string
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
  const [difficulties, setDifficulties] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([])
  const [activeFilter, setActiveFilter] = useState<"difficulty" | "category" | null>(null)
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
          // Fallback to sample data if API fails
          useSamplePoses()
          return
        }
        
        if (!data || data.length === 0) {
          console.warn("No poses found in database, using sample data")
          useSamplePoses()
          return
        }
        
        // Map API response to our expected structure
        const poseData = data.map(pose => ({
          id: pose.id,
          name: pose.english_name,
          sanskrit_name: pose.sanskrit_name,
          category: pose.category,
          difficulty: pose.difficulty_level || pose.difficulty,
          side_option: pose.side_option === true || pose.side_option === "true" 
            ? "left_right" 
            : (pose.side_option || null),
          image_url: pose.image_url
        }))
        
        setPoses(poseData)
        setFilteredPoses(poseData)
        
        // Extract unique categories
        const uniqueCategories = Array.from(
          new Set(poseData.map(pose => pose.category).filter(Boolean))
        ) as string[]
        
        setCategories(uniqueCategories.sort())
        
        // Extract unique difficulties
        const uniqueDifficulties = Array.from(
          new Set(poseData.map(pose => pose.difficulty).filter(Boolean))
        ) as string[]
        
        setDifficulties(uniqueDifficulties.sort())
      } catch (error) {
        console.error("Error in fetchPoses:", error)
        useSamplePoses()
      } finally {
        setIsLoading(false)
      }
    }
    
    const useSamplePoses = () => {
      // Sample poses as fallback
      const samplePoses: Pose[] = [
        {
          id: "1",
          name: "Mountain Pose",
          sanskrit_name: "Tadasana",
          category: "standing",
          difficulty: "beginner",
          side_option: null,
          image_url: "/poses/mountain.jpg"
        },
        {
          id: "2",
          name: "Downward-Facing Dog",
          sanskrit_name: "Adho Mukha Svanasana",
          category: "arm_balance",
          difficulty: "beginner",
          side_option: null,
          image_url: "/poses/downdog.jpg"
        },
        {
          id: "3",
          name: "Warrior I",
          sanskrit_name: "Virabhadrasana I",
          category: "standing",
          difficulty: "intermediate",
          side_option: "left_right",
          image_url: "/poses/warrior1.jpg"
        },
        {
          id: "4",
          name: "Triangle Pose",
          sanskrit_name: "Trikonasana",
          category: "standing",
          difficulty: "intermediate",
          side_option: "left_right",
          image_url: "/poses/triangle.jpg"
        },
        {
          id: "5",
          name: "Child's Pose",
          sanskrit_name: "Balasana",
          category: "seated",
          difficulty: "beginner",
          side_option: null,
          image_url: "/poses/child.jpg"
        },
        {
          id: "6",
          name: "Crow Pose",
          sanskrit_name: "Bakasana",
          category: "arm_balance",
          difficulty: "advanced",
          side_option: null,
          image_url: "/poses/crow.jpg"
        }
      ]
      
      setPoses(samplePoses)
      setFilteredPoses(samplePoses)
      
      // Extract unique categories
      const uniqueCategories = Array.from(
        new Set(samplePoses.map(pose => pose.category).filter(Boolean))
      ) as string[]
      
      setCategories(uniqueCategories)
      
      // Extract unique difficulties
      const uniqueDifficulties = Array.from(
        new Set(samplePoses.map(pose => pose.difficulty).filter(Boolean))
      ) as string[]
      
      setDifficulties(uniqueDifficulties)
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
    
    // Filter by selected difficulties
    if (selectedDifficulties.length > 0) {
      result = result.filter((pose) => 
        pose.difficulty && selectedDifficulties.includes(pose.difficulty)
      )
    }
    
    setFilteredPoses(result)
  }, [searchQuery, selectedCategories, selectedDifficulties, poses])

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    )
  }
  
  const handleDifficultyToggle = (difficulty: string) => {
    setSelectedDifficulties((prev) =>
      prev.includes(difficulty)
        ? prev.filter((d) => d !== difficulty)
        : [...prev, difficulty]
    )
  }

  const clearDifficultyFilters = () => {
    setSelectedDifficulties([]);
  }

  const clearCategoryFilters = () => {
    setSelectedCategories([]);
  }

  const removeFilter = (type: "difficulty" | "category", value: string) => {
    if (type === "difficulty") {
      setSelectedDifficulties(prev => prev.filter(d => d !== value));
    } else {
      setSelectedCategories(prev => prev.filter(c => c !== value));
    }
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
      
      {/* Filter buttons side by side */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <Button 
          variant={activeFilter === "difficulty" ? "default" : "outline"}
          className="w-full justify-between"
          onClick={() => setActiveFilter(activeFilter === "difficulty" ? null : "difficulty")}
        >
          <span>Difficulty</span>
          {activeFilter === "difficulty" ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
        </Button>
        
        <Button 
          variant={activeFilter === "category" ? "default" : "outline"}
          className="w-full justify-between"
          onClick={() => setActiveFilter(activeFilter === "category" ? null : "category")}
        >
          <span>Category</span>
          {activeFilter === "category" ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
        </Button>
      </div>
      
      {/* Filter dropdown content */}
      {activeFilter && (
        <div className="border rounded-md p-3 mb-3">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium">
              {activeFilter === "difficulty" ? "Select Difficulty" : "Select Category"}
            </h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => activeFilter === "difficulty" ? clearDifficultyFilters() : clearCategoryFilters()}
              className="h-7 px-2 text-xs"
            >
              Clear
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {activeFilter === "difficulty" ? 
              difficulties.map(difficulty => (
                <Badge
                  key={difficulty}
                  variant={selectedDifficulties.includes(difficulty) ? "default" : "outline"}
                  className="cursor-pointer capitalize"
                  onClick={() => handleDifficultyToggle(difficulty)}
                >
                  {formatCategory(difficulty)}
                </Badge>
              )) :
              categories.map(category => (
                <Badge
                  key={category}
                  variant={selectedCategories.includes(category) ? "default" : "outline"}
                  className="cursor-pointer capitalize"
                  onClick={() => handleCategoryToggle(category)}
                >
                  {formatCategory(category)}
                </Badge>
              ))
            }
          </div>
        </div>
      )}
      
      {/* Active filters display */}
      {(selectedDifficulties.length > 0 || selectedCategories.length > 0) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedDifficulties.map(difficulty => (
            <Badge key={`active-${difficulty}`} variant="secondary" className="pr-1">
              <span className="mr-1">{formatCategory(difficulty)}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => removeFilter("difficulty", difficulty)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          
          {selectedCategories.map(category => (
            <Badge key={`active-${category}`} variant="secondary" className="pr-1">
              <span className="mr-1">{formatCategory(category)}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => removeFilter("category", category)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="medium" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-2 space-y-1">
          {filteredPoses.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No poses found. Try adjusting your search or filters.
            </div>
          ) : (
            filteredPoses.map((pose) => (
              <div
                key={pose.id}
                className={cn(
                  "bg-white dark:bg-deep-charcoal-light rounded-md p-3 cursor-grab hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
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
                    <Badge variant="outline" className="text-xs capitalize">
                      {formatCategory(pose.category)}
                    </Badge>
                  )}
                  {pose.difficulty && (
                    <Badge variant="outline" className="text-xs capitalize">
                      {formatCategory(pose.difficulty)}
                    </Badge>
                  )}
                  {(pose.side_option === "left_right" || pose.side_option === "both") && (
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