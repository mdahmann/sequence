import { Metadata } from "next"
import { EnhancedSequenceGenerator } from "@/components/enhanced-sequence-generator"
import { EnhancedToastProvider } from "@/components/ui-enhanced/toast-provider"

export const metadata: Metadata = {
  title: "Generate Sequence | Sequence",
  description: "Create customized yoga sequences based on your preferences with our intelligent sequence generator",
}

export default function GeneratePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-12">
        <h1 className="text-3xl md:text-4xl font-sans font-normal tracking-tight text-foreground mb-4 text-center">
          Generate Your Sequence
        </h1>
        <p className="text-center text-muted-foreground max-w-2xl mx-auto">
          Create a customized yoga sequence based on your preferences and needs.
        </p>
      </div>
      
      <div className="mb-16">
        <EnhancedToastProvider>
          <EnhancedSequenceGenerator />
        </EnhancedToastProvider>
      </div>
      
      <div className="bg-warm-white dark:bg-deep-charcoal-light rounded-lg p-8 shadow-sm">
        <h2 className="text-2xl font-sans font-normal tracking-tight text-foreground mb-6 text-center">
          How It Works
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <span className="text-xl font-semibold text-primary">1</span>
            </div>
            <h3 className="text-lg font-medium mb-2">Set Parameters</h3>
            <p className="text-muted-foreground">
              Choose duration, difficulty, style, and focus area for your practice.
            </p>
          </div>
          
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <span className="text-xl font-semibold text-primary">2</span>
            </div>
            <h3 className="text-lg font-medium mb-2">Generate</h3>
            <p className="text-muted-foreground">
              Our AI creates a balanced sequence with mindful transitions.
            </p>
          </div>
          
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <span className="text-xl font-semibold text-primary">3</span>
            </div>
            <h3 className="text-lg font-medium mb-2">Customize</h3>
            <p className="text-muted-foreground">
              Edit your sequence in our intuitive editor to make it perfect.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

