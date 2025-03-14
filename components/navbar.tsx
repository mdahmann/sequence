"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import HandDrawnSpiral from "@/components/hand-drawn-spiral"

export function Navbar() {
  const pathname = usePathname()

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Generate", path: "/generate" },
    { name: "Pose Library", path: "/pose-library" },
    { name: "Flows", path: "/flows" },
  ]

  return (
    <header className="border-b border-muted" style={{ backgroundColor: "#F3F1EB" }}>
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link href="/" className="flex items-center space-x-2">
            <HandDrawnSpiral width={32} height={32} color="#2E43FF" strokeWidth={1.5} />
            <span className="text-xl font-sans font-medium">Sequence</span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center space-x-6">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`py-2 font-sans ${
                pathname === item.path
                  ? "text-[#2E43FF] border-b-2 border-[#2E43FF]"
                  : "text-foreground hover:text-[#2E43FF]"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center space-x-2">
          <Button variant="outline" asChild className="mr-2">
            <Link href="/login">Sign In</Link>
          </Button>
          <Button asChild style={{ backgroundColor: "#2E43FF" }} className="hover:bg-opacity-90">
            <Link href="/signup">Sign Up</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}

