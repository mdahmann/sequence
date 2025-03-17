"use client"

import { Sequence, SequenceParams, SequencePhase, SequenceStructure, SequenceSegment } from "@/types/sequence"
import { v4 as uuidv4 } from 'uuid'

export interface APIError {
  message: string
  status: number
  details?: any
}

export const clientSequenceService = {
  async generateSequence(params: SequenceParams): Promise<Sequence> {
    console.log("clientSequenceService: Generating sequence with params:", params);
    
    try {
      // Get the authentication token from localStorage
      const authToken = localStorage.getItem("supabase.auth.token");
      
      const response = await fetch(`/api/sequence/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": authToken ? `Bearer ${authToken}` : "",
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
  
  // Step 1: Generate just the sequence structure
  async generateStructure(params: SequenceParams): Promise<SequenceStructure> {
    console.log("clientSequenceService: Generating sequence structure with params:", params);
    
    try {
      // Get the authentication token from localStorage
      const authToken = localStorage.getItem("supabase.auth.token");
      
      const response = await fetch(`/api/sequence/structure`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": authToken ? `Bearer ${authToken}` : "",
        },
        body: JSON.stringify(params),
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Response Error:", response.status, errorText);
        throw {
          message: `Failed to generate sequence structure: ${response.status} ${response.statusText}`,
          status: response.status,
          details: { errorText }
        } as APIError;
      }

      const data = await response.json();
      console.log("clientSequenceService: Structure generated successfully");
      return data.structure;
    } catch (error: any) {
      console.error("clientSequenceService: Error generating structure:", error);
      throw error;
    }
  },
  
  // Step 2: Fill the structure with poses
  async fillWithPoses(structure: SequenceStructure, params: SequenceParams): Promise<Sequence> {
    console.log("clientSequenceService: Filling sequence with poses");
    
    try {
      // Get the authentication token from localStorage
      const authToken = localStorage.getItem("supabase.auth.token");
      
      const response = await fetch(`/api/sequence/fill-poses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": authToken ? `Bearer ${authToken}` : "",
        },
        body: JSON.stringify({ structure, params }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Response Error:", response.status, errorText);
        throw {
          message: `Failed to fill sequence with poses: ${response.status} ${response.statusText}`,
          status: response.status,
          details: { errorText }
        } as APIError;
      }

      const data = await response.json();
      console.log("clientSequenceService: Sequence filled with poses successfully");
      return data.sequence;
    } catch (error: any) {
      console.error("clientSequenceService: Error filling sequence with poses:", error);
      throw error;
    }
  },
  
  // Convert structure to a skeleton sequence with empty poses
  createSkeletonSequence(structure: SequenceStructure, params: SequenceParams): Sequence {
    const now = new Date().toISOString();
    
    // Create a sequence with the structure but empty poses
    const sequence: Sequence = {
      id: uuidv4(),
      name: structure.name,
      description: structure.description,
      duration_minutes: params.duration,
      difficulty: params.difficulty,
      style: params.style,
      focus: params.focus,
      notes: structure.intention || params.additionalNotes || "",
      phases: structure.segments.map((segment, index) => {
        // Convert segment to phase
        const phase: SequencePhase = {
          id: uuidv4(),
          name: segment.name,
          description: segment.description,
          poses: []
        };
        
        return phase;
      }),
      created_at: now,
      updated_at: now,
      is_favorite: false
    };
    
    return sequence;
  }
} 