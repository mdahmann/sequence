import { Suspense } from "react"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import { SequenceEditor } from "./components/sequence-editor"
import EnhancedSequenceGenerator from "@/components/enhanced-sequence-generator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const metadata: Metadata = {
  title: "Flow Editor | Sequence",
  description: "Create and edit yoga flows",
}

export default function FlowEditorPage({ params }: { params: { id: string } }) {
  const id = params.id
  
  // If the ID is 'new', show the sequence generator
  if (id === 'new') {
    return (
      <div className="container mx-auto py-6 max-w-5xl">
        <h1 className="text-3xl font-bold mb-6">Create New Flow</h1>
        
        <Tabs defaultValue="generator" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="generator">Generate with AI</TabsTrigger>
            <TabsTrigger value="blank">Start from Blank</TabsTrigger>
          </TabsList>
          
          <TabsContent value="generator">
            <EnhancedSequenceGenerator 
              onSequenceGenerated={(sequence) => {
                // Redirect to the editor for the newly created sequence
                window.location.href = `/flows/${sequence.id}`
              }}
            />
          </TabsContent>
          
          <TabsContent value="blank">
            <div className="bg-muted p-8 rounded-lg text-center">
              <h3 className="text-xl font-medium mb-4">Start with an Empty Flow</h3>
              <p className="mb-6 text-muted-foreground">
                Create a flow from scratch and add poses manually
              </p>
              <button 
                className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md"
                onClick={() => {
                  // Create an empty sequence and redirect
                  window.location.href = `/flows/empty`
                }}
              >
                Create Empty Flow
              </button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    )
  }
  
  // Otherwise, load the sequence editor
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SequenceEditor id={id} />
    </Suspense>
  )
}

