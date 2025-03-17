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
        let errorMessage = 'Failed to generate sequence';
        let errorDetails = null;
        
        // Try to parse the error response
        try {
          const errorData = await response.json();
          // Use the server message if available, otherwise fallback to status text
          errorMessage = errorData.message || errorData.error || response.statusText || errorMessage;
          errorDetails = errorData.details;
          
          console.log('Received API error:', {
            status: response.status,
            message: errorMessage,
            details: errorDetails
          });
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
        }
        
        // Throw a well-formed error object
        throw {
          message: errorMessage,
          status: response.status,
          details: errorDetails,
        } as APIError;
      }

      const data = await response.json()
      return data.sequence
    } catch (error) {
      // If this is already a properly formatted API error, just rethrow it
      if (error && typeof error === 'object' && 'status' in error && 'message' in error) {
        console.log('Rethrowing API error:', error);
        throw error;
      }
      
      // Otherwise, format as a generic error
      console.error('Unhandled error in sequence generation:', error);
      throw {
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        status: 0,
        details: { originalError: error },
      } as APIError;
    }
  },
} 