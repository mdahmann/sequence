'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { PageContainer } from '@/components/page-container'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <PageContainer>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h1 className="text-4xl font-bold mb-4">Something went wrong</h1>
        <p className="text-lg mb-8">
          We apologize for the inconvenience
        </p>
        <div className="flex flex-col gap-4 sm:flex-row">
          <button
            onClick={reset}
            className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Try again
          </button>
          <Link 
            href="/"
            className="px-6 py-3 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
          >
            Return Home
          </Link>
        </div>
      </div>
    </PageContainer>
  )
} 