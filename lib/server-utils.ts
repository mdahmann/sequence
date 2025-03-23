// Server-only utilities - do not import in client components
import { promises as fs } from 'fs'
import path from 'path'
import { getDifficultyVariationText } from './prompt-utils'

// Server-only function to get yoga guidelines
export async function getYogaGuidelines(style?: string, focus?: string, difficulty?: string): Promise<string> {
  try {
    // If no parameters provided, try to read from the general guidelines file
    if (!style && !focus && !difficulty) {
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
    }
    
    // Normalize parameters
    const normalizedStyle = style?.toLowerCase() || 'vinyasa'
    const normalizedFocus = focus?.toLowerCase().replace(/\s+/g, '-') || 'full-body'
    const normalizedDifficulty = difficulty?.toLowerCase() || 'intermediate'
    
    // Calculate difficulty variation text
    const difficultyVariations = getDifficultyVariationText(normalizedDifficulty)
    
    // Load style guidelines
    let styleGuidelines = ''
    try {
      const stylePath = path.join(process.cwd(), 'lib', 'prompts', 'styles', `${normalizedStyle}.md`)
      const styleContent = await fs.readFile(stylePath, 'utf8')
      styleGuidelines = styleContent
        .replace(/{{difficulty}}/g, normalizedDifficulty)
        .replace(/{{difficulty_variations}}/g, difficultyVariations)
        .replace(/{{focus}}/g, focus || 'full body')
    } catch (error) {
      console.error(`Error loading style guidelines for ${normalizedStyle}:`, error)
      styleGuidelines = `Focus on proper alignment and breath control for ${normalizedStyle} yoga.`
    }
    
    // Load focus guidelines
    let focusGuidelines = ''
    try {
      const focusPath = path.join(process.cwd(), 'lib', 'prompts', 'focus', `${normalizedFocus}.md`)
      focusGuidelines = await fs.readFile(focusPath, 'utf8')
    } catch (error) {
      console.error(`Error loading focus guidelines for ${normalizedFocus}:`, error)
      focusGuidelines = `Focus on poses that target the ${focus || 'full body'}.`
    }
    
    // Load difficulty guidelines
    let difficultyGuidelines = ''
    try {
      const difficultyPath = path.join(process.cwd(), 'lib', 'prompts', 'difficulty', `${normalizedDifficulty}.md`)
      difficultyGuidelines = await fs.readFile(difficultyPath, 'utf8')
    } catch (error) {
      console.error(`Error loading difficulty guidelines for ${normalizedDifficulty}:`, error)
      difficultyGuidelines = `Adjust poses and transitions for ${normalizedDifficulty} level practitioners.`
    }
    
    // Load general principles
    let generalPrinciples = ''
    try {
      const principlesPath = path.join(process.cwd(), 'lib', 'prompts', 'general-principles.md')
      generalPrinciples = await fs.readFile(principlesPath, 'utf8')
    } catch (error) {
      console.error(`Error loading general principles:`, error)
      generalPrinciples = `Follow standard yoga sequencing principles.`
    }
    
    // Combine all guidelines with proper headers
    return `
      STYLE GUIDELINES (${style || 'Vinyasa'}):
      ${styleGuidelines}
      
      FOCUS AREA (${focus || 'Full Body'}):
      ${focusGuidelines}
      
      DIFFICULTY LEVEL (${difficulty || 'Intermediate'}):
      ${difficultyGuidelines}
      
      GENERAL SEQUENCING PRINCIPLES:
      ${generalPrinciples}
    `
  } catch (err) {
    console.error("Error reading yoga guidelines:", err)
    return 'Standard yoga guidelines: Focus on alignment, breath, and safe progression.'
  }
} 