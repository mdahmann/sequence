import { SequenceGenerator } from "./components/sequence-generator"
import { PageContainer } from "@/components/page-container"

export default function GeneratePage() {
  return (
    <PageContainer centered>
      <h1 className="text-4xl font-normal text-center mb-4">Generate Your Sequence</h1>
      <p className="text-lg text-center text-muted-foreground mb-12">
        Create a personalized yoga sequence with our AI-powered generator.
      </p>

      <SequenceGenerator />
    </PageContainer>
  )
}

