import { FlowsList } from "./components/flows-list"

export default function FlowsPage() {
  return (
    <div className="container py-6 md:py-10">
      <h1 className="text-4xl font-normal text-center mb-4">Your Flows</h1>
      <p className="text-lg text-center text-muted-foreground mb-12">
        View, edit, and manage your saved yoga sequences
      </p>
      <FlowsList />
    </div>
  )
}

