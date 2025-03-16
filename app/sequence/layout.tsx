"use client"

import type { ReactNode } from "react"

interface SequenceLayoutProps {
  children: ReactNode
}

export default function SequenceLayout({
  children,
}: SequenceLayoutProps) {
  return (
    <div className="min-h-screen w-full">
      {children}
    </div>
  )
} 