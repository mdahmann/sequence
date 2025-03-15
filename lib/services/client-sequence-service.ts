"use client"

import { Sequence, SequenceParams } from "@/types/sequence"

export interface APIError {
  message: string
  status: number
  details?: any
}

export const clientSequenceService = {
  async generateSequence(params: SequenceParams): Promise<Sequence> {
    try {
      const response = await fetch('/api/sequence/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw {
          message: errorData.error || 'Failed to generate sequence',
          status: response.status,
          details: errorData.details,
        } as APIError
      }

      const data = await response.json()
      return data.sequence
    } catch (error) {
      if ((error as APIError).status) {
        throw error
      }
      
      throw {
        message: (error as Error).message || 'Network error occurred',
        status: 0,
      } as APIError
    }
  },
} 