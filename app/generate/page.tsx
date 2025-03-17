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
      
      <div className="mb-24">
        <EnhancedToastProvider>
          <EnhancedSequenceGenerator />
        </EnhancedToastProvider>
      </div>
      
      <div className="mt-16 pt-16 pb-32 border-t border-gray-200 dark:border-gray-800">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-sans font-normal tracking-tight text-foreground mb-3">
            How It Works
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Three simple steps to create your perfect yoga sequence
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="flex flex-col items-center text-center group">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
              <span className="text-2xl font-semibold text-primary">1</span>
            </div>
            <h3 className="text-xl font-medium mb-3">Set Parameters</h3>
            <p className="text-muted-foreground">
              Choose duration, difficulty, style, and focus area for your practice.
            </p>
          </div>
          
          <div className="flex flex-col items-center text-center group">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
              <span className="text-2xl font-semibold text-primary">2</span>
            </div>
            <h3 className="text-xl font-medium mb-3">Generate</h3>
            <p className="text-muted-foreground">
              Our AI creates a balanced sequence with mindful transitions.
            </p>
          </div>
          
          <div className="flex flex-col items-center text-center group">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
              <span className="text-2xl font-semibold text-primary">3</span>
            </div>
            <h3 className="text-xl font-medium mb-3">Customize</h3>
            <p className="text-muted-foreground">
              Edit your sequence in our intuitive editor to make it perfect.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

