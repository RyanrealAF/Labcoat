import { Env } from './types'; 
 
export async function generateEmbedding( 
  ai: Ai, 
  text: string 
): Promise<number[]> { 
  try { 
    const response = await ai.run('@cf/baai/bge-base-en-v1.5', { 
      text: [text] 
    }); 
     
    // Workers AI returns: { data: [[768 floats]] } 
    if (response && (response as any).data && (response as any).data[0]) { 
      return (response as any).data[0]; 
    } 
     
    throw new Error('Invalid AI response format'); 
  } catch (error) { 
    console.error('Embedding generation failed:', error); 
    throw error; 
  } 
} 
 
export async function queryVectorize( 
  vectorize: VectorizeIndex, 
  embedding: number[], 
  topK: number = 10 
): Promise<VectorizeMatches> { 
  try { 
    const results = await vectorize.query(embedding, { 
      topK, 
      returnMetadata: 'all' 
    }); 
     
    return results; 
  } catch (error) { 
    console.error('Vectorize query failed:', error); 
    throw error; 
  } 
} 
