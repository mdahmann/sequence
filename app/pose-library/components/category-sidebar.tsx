"use client"

import { getCategorySlug } from "@/lib/utils"

interface CategorySidebarProps {
  selectedCategory: string
  onCategoryChange: (category: string) => void
}

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

export function CategorySidebar({ selectedCategory, onCategoryChange }: CategorySidebarProps) {
  return (
    <div className="bg-muted/20 p-4 rounded-lg">
      <h3 className="font-medium mb-3 flex items-center">
        <span className="mr-2">Categories</span>
      </h3>
      <div className="space-y-2">
        {categoryOptions.map((category) => {
          const categoryValue = category === "All Categories" ? "all" : getCategorySlug(category)

          return (
            <div
              key={category}
              className={`px-3 py-2 rounded-md cursor-pointer ${
                selectedCategory === categoryValue ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50"
              }`}
              onClick={() => onCategoryChange(categoryValue)}
            >
              {category}
            </div>
          )
        })}
      </div>
    </div>
  )
}

