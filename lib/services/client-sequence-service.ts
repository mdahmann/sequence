"use client"

import { Sequence, SequenceParams } from "@/types/sequence"

export interface APIError {
  message: string
  status: number
  details?: any
}

export const clientSequenceService = {
  async generateSequence(params: SequenceParams): Promise<Sequence> {
    console.log("clientSequenceService: Generating sequence with params:", params);
    
    try {
      const response = await fetch(`/api/sequence/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Response Error:", response.status, errorText);
        throw {
          message: `Failed to generate sequence: ${response.status} ${response.statusText}`,
          status: response.status,
          details: { errorText }
        } as APIError;
      }

      const data = await response.json();
      console.log("clientSequenceService: Sequence generated successfully");
      return data.sequence;
    } catch (error: any) {
      console.error("clientSequenceService: Error generating sequence:", error);
      throw error;
    }
  },
} 