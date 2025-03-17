import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Sparkles, Edit, MessageCircle, Eye } from "lucide-react"
import HandDrawnSpiral from "@/components/hand-drawn-spiral"

export default function Home() {
  return (
    <div className="flex flex-col items-center">
      <section
        className="w-full py-12 md:py-24 lg:py-32 flex flex-col items-center text-center bg-[url('/images/paper-bg.jpg')] bg-repeat"
      >
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 mb-12">
            <div className="mb-8">
              <HandDrawnSpiral width={80} height={80} color="hsl(var(--primary))" strokeWidth={1.5} animate={true} />
            </div>

            <h1 className="text-5xl md:text-6xl font-sans font-normal tracking-tighter text-foreground">Sequence</h1>

            <p className="text-md md:text-xl text-muted-foreground max-w-[700px] mx-auto">
              Create flowing, intuitive yoga sequences that guide your practice with mindful transitions and balanced
              energy.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Button
                asChild
                size="lg"
                variant="default"
                className="rounded-md"
              >
                <Link href="/generate" className="flex items-center">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Sequence
                </Link>
              </Button>

              <Button asChild variant="outline" size="lg" className="text-primary border-primary">
                <Link href="/preview" className="flex items-center">
                  <Eye className="mr-2 h-4 w-4" />
                  View Example
                </Link>
              </Button>
              
              <Button asChild variant="outline" size="lg">
                <Link href="/flows" className="flex items-center">
                  View Saved Flows
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full py-12 md:py-24 bg-white">
        <div className="container px-4 md:px-6">
          <h2 className="text-3xl font-serif font-normal text-center mb-12">
            Create flowing sequences with intuitive design
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border border-muted">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-serif font-normal">AI-Generated Sequences</h3>
                  <p className="text-muted-foreground">
                    Intelligently generate yoga sequences around a peak pose with natural, flowing transitions.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-muted">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Edit className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-serif font-normal">Customizable Flows</h3>
                  <p className="text-muted-foreground">
                    Easily edit and personalize your sequences with our intuitive drag-and-drop interface.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-muted">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="p-2 rounded-full bg-primary/10">
                    <MessageCircle className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-serif font-normal">Mindful Cues</h3>
                  <p className="text-muted-foreground">
                    Add personalized teaching cues to guide your practice or your students.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}

