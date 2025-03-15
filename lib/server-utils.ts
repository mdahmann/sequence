// Server-only utilities - do not import in client components
import { promises as fs } from 'fs'
import path from 'path'

// Server-only function to get yoga guidelines
export async function getYogaGuidelines(): Promise<string> {
  try {
    const guidelinesPath = path.join(process.cwd(), 'yogaguidelines.md')
    
    try {
      // Check if file exists first
      await fs.access(guidelinesPath)
      // If it does, read it
      return await fs.readFile(guidelinesPath, 'utf8')
    } catch (error) {
      // File does not exist or cannot be accessed
      console.error("Error accessing yoga guidelines:", error)
      return ''
    }
  } catch (err) {
    console.error("Error reading yoga guidelines:", err)
    return ''
  }
} 