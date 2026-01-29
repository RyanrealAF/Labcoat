// src/config/env.ts

/**
 * Centralized environment and API configuration
 */
export const API_CONFIG = {
  // Curriculum API endpoint
  curriculum: (import.meta.env.VITE_CURRICULUM_API_URL as string) || 'http://localhost:8787',
  
  // Operational parameters
  maxRetries: 3,
  timeout: 10000,
  
  // Semantic search settings
  semantic: {
    minQueryLength: 3,
    topK: 5,
    debounceMs: 500
  }
};
