"use client"

import { EnhancedToastProvider } from "@/components/ui-enhanced/toast-provider"
import type { ReactNode } from "react"

interface SequenceLayoutProps {
  children: ReactNode
}

export default function SequenceEditorLayout({
  children,
}: SequenceLayoutProps) {
  return (
    <EnhancedToastProvider>
      <div className="min-h-screen w-full bg-beige dark:bg-dark-gray">
        {children}
      </div>
    </EnhancedToastProvider>
  )
} 