import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Sparkles, Edit, MessageCircle } from "lucide-react"
import HandDrawnSpiral from "@/components/hand-drawn-spiral"

export default function Home() {
  return (
    <div className="flex flex-col items-center">
      <section
        className="w-full py-12 md:py-24 lg:py-32 flex flex-col items-center text-center"
        style={{ backgroundColor: "#F3F1EB" }}
      >
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 mb-12">
            <div className="mb-8">
              <HandDrawnSpiral width={80} height={80} color="#2E43FF" strokeWidth={1.5} animate={true} />
            </div>

            <h1 className="text-5xl md:text-6xl font-sans font-normal tracking-tighter text-[#333333]">Sequence</h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-[700px] mx-auto font-serif">
              Create flowing, intuitive yoga sequences that guide your practice with mindful transitions and balanced
              energy.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Button
                asChild
                size="lg"
                style={{ backgroundColor: "#2E43FF" }}
                className="text-white rounded-md hover:bg-opacity-90"
              >
                <Link href="/generate" className="flex items-center">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Sequence
                </Link>
              </Button>

              <Button asChild variant="outline" size="lg" style={{ borderColor: "#2E43FF", color: "#2E43FF" }}>
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
                  <div className="p-2 rounded-full" style={{ backgroundColor: "rgba(46, 67, 255, 0.1)" }}>
                    <Sparkles className="h-6 w-6" style={{ color: "#2E43FF" }} />
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
                  <div className="p-2 rounded-full" style={{ backgroundColor: "rgba(46, 67, 255, 0.1)" }}>
                    <Edit className="h-6 w-6" style={{ color: "#2E43FF" }} />
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
                  <div className="p-2 rounded-full" style={{ backgroundColor: "rgba(46, 67, 255, 0.1)" }}>
                    <MessageCircle className="h-6 w-6" style={{ color: "#2E43FF" }} />
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

