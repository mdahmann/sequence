import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { PoseCategory } from "@/types/pose"

// Client-safe utility functions
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCategory(category: PoseCategory | string | null): string {
  if (!category) return "Uncategorized"

  return category
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export function getCategorySlug(category: string): PoseCategory {
  const formatted = category.toLowerCase().replace(/\s+/g, "_") as PoseCategory

  return formatted
}

