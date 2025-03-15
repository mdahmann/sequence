"use client"

import { ReactNode } from "react"
import { EnhancedToastProvider } from "@/components/ui-enhanced/toast-provider"

interface SequenceLayoutProps {
  children: ReactNode
}

export default function SequenceEditorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <EnhancedToastProvider>
      <div className="min-h-screen">
        {children}
      </div>
    </EnhancedToastProvider>
  )
} 