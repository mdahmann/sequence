import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { publicSans, merriweather } from "./fonts"

export const metadata: Metadata = {
  title: "Sequence - AI-Powered Yoga Sequence Builder",
  description: "Create flowing, intuitive yoga sequences with mindful transitions and balanced energy.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${publicSans.variable} ${merriweather.variable}`}>
      <body className="min-h-screen flex flex-col" style={{ backgroundColor: "#F3F1EB" }}>
        <ThemeProvider attribute="class" defaultTheme="light">
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}



import './globals.css'