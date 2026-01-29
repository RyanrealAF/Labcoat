export interface Env { 
  VECTORIZE: VectorizeIndex; 
  D1: D1Database; 
  AI: Ai; 
} 
 
export interface QueryRequest { 
  query: string; 
  topK?: number; 
  returnMetadata?: boolean; 
  includeRelationships?: boolean; 
} 
 
export interface EnrichedResult { 
  score: number; 
  lesson: Lesson; 
  relationships?: Relationship[]; 
  metadata: Record<string, any>; 
} 
 
export interface Lesson { 
  id: string; 
  sequence: number; 
  title: string; 
  tactical_concept: string; 
  module_id: string; 
  phase: string; 
} 
 
export interface Relationship { 
  source_concept: string; 
  target_concept: string; 
  relationship_type: string; 
  logic_rationale: string; 
} 
