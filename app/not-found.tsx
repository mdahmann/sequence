import Link from 'next/link'
import { PageContainer } from '@/components/page-container'
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"

export default function NotFound() {
  return (
    <PageContainer>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
        <p className="text-lg mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            asChild
            size="lg"
            variant="default"
            className="rounded-md"
          >
            <Link href="/">
              Return Home
            </Link>
          </Button>
          
          <Button asChild variant="outline" size="lg">
            <Link href="/pose-library">
              Browse Pose Library
            </Link>
          </Button>
        </div>
      </div>
    </PageContainer>
  )
} 