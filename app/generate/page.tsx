import { Metadata } from "next"
import { EnhancedSequenceGenerator } from "@/components/enhanced-sequence-generator"
import { EnhancedToastProvider } from "@/components/ui-enhanced/toast-provider"

export const metadata: Metadata = {
  title: "Generate Sequence | Sequence",
  description: "Create customized yoga sequences based on your preferences with our intelligent sequence generator",
}

export default function GeneratePage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-warm-white dark:bg-deep-charcoal-light rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-deep-charcoal dark:text-warm-white">
            Features
          </h2>
          <ul className="space-y-3 text-muted-gray dark:text-muted-beige">
            <li className="flex items-start">
              <div className="flex-shrink-0 h-5 w-5 text-vibrant-blue">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="ml-2">Animated UI components</span>
            </li>
            <li className="flex items-start">
              <div className="flex-shrink-0 h-5 w-5 text-vibrant-blue">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="ml-2">Improved error handling</span>
            </li>
            <li className="flex items-start">
              <div className="flex-shrink-0 h-5 w-5 text-vibrant-blue">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="ml-2">Enhanced toast notifications</span>
            </li>
            <li className="flex items-start">
              <div className="flex-shrink-0 h-5 w-5 text-vibrant-blue">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="ml-2">Better loading indicators</span>
            </li>
          </ul>
        </div>
        
        <div className="bg-warm-white dark:bg-deep-charcoal-light rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-deep-charcoal dark:text-warm-white">
            How It Works
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-muted-gray dark:text-muted-beige ml-4">
            <li>Select your preferred duration (5-90 minutes)</li>
            <li>Choose a difficulty level that matches your experience</li>
            <li>Pick a yoga style you want to practice</li>
            <li>Select which area of the body you want to focus on</li>
            <li>Add any specific requirements (optional)</li>
            <li>Click "Generate Sequence" to create your custom practice</li>
          </ol>
        </div>
      </div>
      
      <div className="lg:col-span-8">
        <EnhancedToastProvider>
          <EnhancedSequenceGenerator />
        </EnhancedToastProvider>
      </div>
    </div>
  )
}

