"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Database } from "@/types/supabase"

type Pose = Database["public"]["Tables"]["poses"]["Row"]

const difficultyOptions = ["All Levels", "Beginner", "Intermediate", "Advanced"]
const categoryOptions = [
  "All Categories",
  "Standing",
  "Seated",
  "Supine",
  "Prone",
  "Arm Balance",
  "Inversion",
  "Balance",
  "Forward Bend",
  "Backbend",
  "Twist",
  "Side Bend",
]

export function PoseLibrary({ initialPoses }: { initialPoses: Pose[] }) {
  const [poses, setPoses] = useState<Pose[]>(initialPoses)
  const [filteredPoses, setFilteredPoses] = useState<Pose[]>(initialPoses)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDifficulty, setSelectedDifficulty] = useState("All Levels")
  const [selectedCategory, setSelectedCategory] = useState("All Categories")

  useEffect(() => {
    let filtered = poses

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (pose) =>
          pose.english_name.toLowerCase().includes(query) ||
          (pose.sanskrit_name && pose.sanskrit_name.toLowerCase().includes(query)),
      )
    }

    // Filter by difficulty
    if (selectedDifficulty !== "All Levels") {
      filtered = filtered.filter((pose) => pose.difficulty_level?.toLowerCase() === selectedDifficulty.toLowerCase())
    }

    // Filter by category
    if (selectedCategory !== "All Categories") {
      const categoryMap: Record<string, string> = {
        Standing: "standing",
        Seated: "seated",
        Supine: "supine",
        Prone: "prone",
        "Arm Balance": "arm_balance",
        Inversion: "inversion",
        Balance: "balance",
        "Forward Bend": "forward_bend",
        Backbend: "backbend",
        Twist: "twist",
        "Side Bend": "side_bend",
      }

      filtered = filtered.filter((pose) => pose.category === categoryMap[selectedCategory])
    }

    setFilteredPoses(filtered)
  }, [searchQuery, selectedDifficulty, selectedCategory, poses])

  const formatCategory = (category: string | null) => {
    if (!category) return ""
    return category
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  return (
    <div>
      <div className="flex flex-col space-y-4 mb-8">
        <Input
          type="search"
          placeholder="Search poses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-full"
        />

        <div className="flex flex-wrap gap-2">
          {difficultyOptions.map((difficulty) => (
            <Button
              key={difficulty}
              variant={selectedDifficulty === difficulty ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedDifficulty(difficulty)}
              className="rounded-full"
            >
              {difficulty}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-3">
          <div className="bg-muted/20 p-4 rounded-lg">
            <h3 className="font-medium mb-3 flex items-center">
              <span className="mr-2">Categories</span>
            </h3>
            <div className="space-y-2">
              {categoryOptions.map((category) => (
                <div
                  key={category}
                  className={`px-3 py-2 rounded-md cursor-pointer ${
                    selectedCategory === category ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50"
                  }`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-12 md:col-span-9">
          <div className="mb-4">
            <p>Showing {filteredPoses.length} poses</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPoses.map((pose) => (
              <Card key={pose.id} className="border border-muted">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="bg-muted/30 text-xs px-2 py-1 rounded-md inline-block mb-2">Pose</div>
                      <h3 className="font-bold">{pose.english_name}</h3>
                      <p className="text-sm text-muted-foreground italic">{pose.sanskrit_name}</p>
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Info className="h-4 w-4" />
                            <span className="sr-only">Pose Info</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <div className="space-y-2">
                            <p>
                              <strong>Description:</strong> {pose.description || "No description available"}
                            </p>
                            <p>
                              <strong>Benefits:</strong> {pose.benefits || "No benefits listed"}
                            </p>
                            <p>
                              <strong>Category:</strong> {formatCategory(pose.category)}
                            </p>
                            <p>
                              <strong>Difficulty:</strong> {pose.difficulty_level}
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

