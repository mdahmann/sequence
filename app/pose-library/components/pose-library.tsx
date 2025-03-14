"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { Pose, PoseDifficulty } from "@/types/pose"
import { PoseCard } from "./pose-card"
import { CategorySidebar } from "./category-sidebar"

interface PoseLibraryProps {
  initialPoses: Pose[]
}

const difficultyOptions: { label: string; value: string }[] = [
  { label: "All Levels", value: "all" },
  { label: "Beginner", value: "beginner" },
  { label: "Intermediate", value: "intermediate" },
  { label: "Advanced", value: "advanced" },
]

export function PoseLibrary({ initialPoses }: PoseLibraryProps) {
  const [poses, setPoses] = useState<Pose[]>(initialPoses)
  const [filteredPoses, setFilteredPoses] = useState<Pose[]>(initialPoses)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDifficulty, setSelectedDifficulty] = useState("all")
  const [selectedCategory, setSelectedCategory] = useState("all")

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
    if (selectedDifficulty !== "all") {
      filtered = filtered.filter((pose) => pose.difficulty_level === (selectedDifficulty as PoseDifficulty))
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((pose) => pose.category === selectedCategory)
    }

    setFilteredPoses(filtered)
  }, [searchQuery, selectedDifficulty, selectedCategory, poses])

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
              key={difficulty.value}
              variant={selectedDifficulty === difficulty.value ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedDifficulty(difficulty.value)}
              className="rounded-full"
            >
              {difficulty.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-3">
          <CategorySidebar selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />
        </div>

        <div className="col-span-12 md:col-span-9">
          <div className="mb-4">
            <p>Showing {filteredPoses.length} poses</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPoses.map((pose) => (
              <PoseCard key={pose.id} pose={pose} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

