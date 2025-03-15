"use client"

import { useState } from "react"
import { useSupabase } from "@/components/providers"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"

export default function PoseSelectionTestPage() {
  const { supabase } = useSupabase()
  const [searchQuery, setSearchQuery] = useState("")
  const [poses, setPoses] = useState<any[]>([])
  const [selectedPose, setSelectedPose] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchPoses = async () => {
    setIsLoading(true)
    setError(null)
    setPoses([])
    
    try {
      console.log("Searching for poses with query:", searchQuery)
      
      let query = supabase.from("poses").select("*")
      
      if (searchQuery) {
        query = query.ilike("name", `%${searchQuery}%`)
      }
      
      const { data, error } = await query.limit(20)
      
      if (error) throw error
      
      console.log(`Found ${data?.length || 0} poses`)
      setPoses(data || [])
      
    } catch (err: any) {
      console.error("Error searching poses:", err)
      setError(err.message || "Failed to search poses")
      toast({
        title: "Error",
        description: err.message || "Failed to search poses",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const viewPoseDetails = async (poseId: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      console.log("Fetching details for pose:", poseId)
      
      const { data, error } = await supabase
        .from("poses")
        .select("*")
        .eq("id", poseId)
        .single()
      
      if (error) throw error
      
      console.log("Pose details:", data)
      setSelectedPose(data)
      
    } catch (err: any) {
      console.error("Error fetching pose details:", err)
      setError(err.message || "Failed to fetch pose details")
      toast({
        title: "Error",
        description: err.message || "Failed to fetch pose details",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Pose Selection Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Search Poses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Search by name</Label>
                  <Input
                    id="search"
                    placeholder="e.g. Downward Dog"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <Button 
                  onClick={searchPoses} 
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? "Searching..." : "Search"}
                </Button>
                
                {error && <p className="text-red-500">{error}</p>}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Results</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p>Loading poses...</p>
              ) : poses.length === 0 ? (
                <p className="text-muted-foreground">No poses found</p>
              ) : (
                <div className="space-y-2">
                  {poses.map((pose) => (
                    <Button
                      key={pose.id}
                      variant={selectedPose?.id === pose.id ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => viewPoseDetails(pose.id)}
                    >
                      {pose.name || "Unnamed Pose"}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Pose Details</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedPose ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">Name</h3>
                    <p>{selectedPose.name || "N/A"}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Sanskrit Name</h3>
                    <p>{selectedPose.sanskrit_name || "N/A"}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Description</h3>
                    <p>{selectedPose.description || "No description available"}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Category</h3>
                    <p>{selectedPose.category || "N/A"}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Difficulty</h3>
                    <p>{selectedPose.difficulty || "N/A"}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">ID</h3>
                    <p className="text-xs break-all">{selectedPose.id}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Raw Data</h3>
                    <pre className="text-xs overflow-auto p-2 bg-muted rounded-md max-h-40">
                      {JSON.stringify(selectedPose, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Select a pose to view details</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 