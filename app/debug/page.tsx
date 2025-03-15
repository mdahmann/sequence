import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function DebugPage() {
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Debug Tools</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Database Schema</CardTitle>
            <CardDescription>
              View database tables, columns, and sample data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/debug/schema">
              <Button className="w-full">View Schema</Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Pose Selection Test</CardTitle>
            <CardDescription>
              Test the pose selection modal functionality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/debug/pose-selection">
              <Button className="w-full">Test Pose Selection</Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Sequence Generation</CardTitle>
            <CardDescription>
              Test the sequence generation API
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/generate">
              <Button className="w-full">Generate Sequence</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 