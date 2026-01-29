export async function generateEmbedding(ai, text) {
    try {
        const response = await ai.run('@cf/baai/bge-base-en-v1.5', {
            text: [text]
        });
        // Workers AI returns: { data: [[768 floats]] } 
        if (response && response.data && response.data[0]) {
            return response.data[0];
        }
        throw new Error('Invalid AI response format');
    }
    catch (error) {
        console.error('Embedding generation failed:', error);
        throw error;
    }
}
export async function queryVectorize(vectorize, embedding, topK = 10) {
    try {
        const results = await vectorize.query(embedding, {
            topK,
            returnMetadata: 'all'
        });
        return results;
    }
    catch (error) {
        console.error('Vectorize query failed:', error);
        throw error;
    }
}
