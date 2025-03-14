import Link from "next/link"
import HandDrawnSpiral from "./hand-drawn-spiral"

export function Footer() {
  return (
    <footer className="w-full border-t border-muted bg-background">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between text-sm">
        <div className="flex items-center space-x-2">
          <HandDrawnSpiral width={20} height={20} color="hsl(var(--primary))" strokeWidth={1.5} />
          <span>Sequence</span>
        </div>

        <div className="text-muted-foreground">
          Created with <span className="text-red-500">❤️</span> for yoga practitioners
        </div>

        <nav className="flex items-center space-x-6">
          <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
            Terms
          </Link>
          <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
            Privacy
          </Link>
          <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
            Contact
          </Link>
        </nav>
      </div>
    </footer>
  )
}

