import React from "react"
import { cn } from "@/lib/utils"

interface PageContainerProps {
  children: React.ReactNode
  className?: string
  centered?: boolean
  maxWidth?: "default" | "narrow" | "medium" | "wide"
}

export function PageContainer({
  children,
  className,
  centered = false,
  maxWidth = "default",
}: PageContainerProps) {
  const maxWidthClass = {
    narrow: "max-w-3xl",
    medium: "max-w-4xl",
    default: "max-w-5xl",
    wide: "max-w-7xl",
  }[maxWidth]

  return (
    <div 
      className={cn(
        "container px-4 py-8 mx-auto",
        maxWidthClass,
        centered && "flex flex-col items-center",
        className
      )}
    >
      {children}
    </div>
  )
} 