import { SequenceGenerator } from "./components/sequence-generator"

export default function GeneratePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-normal text-center mb-4">Generate Your Sequence</h1>
      <p className="text-lg text-center text-muted-foreground mb-12">
        Create a personalized yoga sequence with our AI-powered generator.
      </p>

      <SequenceGenerator />
    </div>
  )
}

