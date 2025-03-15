import Link from "next/link"
import { SequenceGenerator } from "./components/sequence-generator"
import { PageContainer } from "@/components/page-container"

export default function GeneratePage() {
  return (
    <PageContainer centered>
      <div className="mb-6 flex justify-center">
        <Link 
          href="/generate/beta" 
          className="inline-flex items-center px-4 py-2 bg-vibrant-blue/10 hover:bg-vibrant-blue/20 text-vibrant-blue text-sm font-medium rounded-full transition-colors duration-150"
        >
          <span className="mr-1.5">Try our new beta generator</span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </div>
      
      <h1 className="text-4xl font-normal text-center mb-4">Generate Your Sequence</h1>
      <p className="text-lg text-center text-muted-foreground mb-12">
        Create a personalized yoga sequence with our AI-powered generator.
      </p>

      <SequenceGenerator />
    </PageContainer>
  )
}

