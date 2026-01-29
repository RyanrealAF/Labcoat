import { generateEmbedding, queryVectorize } from './vectorize';
import { getLessonById, getRelationships } from './d1';
import { decodeTopic } from './agent_core';
const RATE_LIMIT = 100; // requests per minute per IP
const REQUIRED_SCHEMA_VERSION = 1;
async function checkRateLimit(ip) {
    const cache = caches.default;
    // Cache API requires a Request or URL string
    const key = `https://rate-limit.local/${ip}/${Math.floor(Date.now() / 60000)}`;
    const countResponse = await cache.match(key);
    let count = 0;
    if (countResponse) {
        count = parseInt(await countResponse.text());
    }
    if (count >= RATE_LIMIT)
        return false;
    await cache.put(key, new Response(String(count + 1), {
        headers: { 'Cache-Control': 'max-age=60' }
    }));
    return true;
}
async function validateSchema(db) {
    try {
        const result = await db.prepare('SELECT version FROM schema_version ORDER BY version DESC LIMIT 1').first();
        if (!result || result.version < REQUIRED_SCHEMA_VERSION) {
            throw new Error('Database schema outdated. Run migrations.');
        }
    }
    catch (error) {
        if (error.message?.includes('no such table: schema_version')) {
            throw new Error('Database schema not initialized. Run migrations.');
        }
        throw error;
    }
}
export default {
    async fetch(request, env) {
        // CORS headers 
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }
        // 1. Rate Limiting
        const ip = request.headers.get('cf-connecting-ip') || 'unknown';
        const isAllowed = await checkRateLimit(ip);
        if (!isAllowed) {
            return Response.json({ error: 'Rate limit exceeded' }, { status: 429, headers: corsHeaders });
        }
        // 2. Schema Validation
        try {
            await validateSchema(env.D1);
        }
        catch (error) {
            return Response.json({ error: error.message }, { status: 503, headers: corsHeaders });
        }
        const url = new URL(request.url);
        // Route: GET /api/decode - Tactical decoding
        if (url.pathname === '/api/decode' && request.method === 'GET') {
            try {
                const topic = url.searchParams.get('topic') || '';
                // Fetch content from D1
                const contentResult = await env.D1.prepare("SELECT tactical_concept FROM lessons WHERE title = ?").bind(topic).first();
                const content = contentResult?.tactical_concept || "No content found for analysis.";
                const analysis = await decodeTopic(topic, content, env);
                return Response.json(analysis, { headers: corsHeaders });
            }
            catch (error) {
                console.error('Decoding failed:', error);
                return Response.json({ error: 'Decoding failed', details: error.message }, { status: 500, headers: corsHeaders });
            }
        }
        // Route: POST /query - Semantic search 
        if (url.pathname === '/query' && request.method === 'POST') {
            try {
                const body = await request.json();
                if (!body.query) {
                    return Response.json({ error: 'Missing query parameter' }, { status: 400, headers: corsHeaders });
                }
                // 1. Generate embedding for query 
                console.log(`Generating embedding for: "${body.query}"`);
                const embedding = await generateEmbedding(env.AI, body.query);
                // 2. Query Vectorize 
                console.log(`Querying Vectorize (topK: ${body.topK || 10})`);
                const vectorMatches = await queryVectorize(env.VECTORIZE, embedding, body.topK || 10);
                // 3. Enrich with D1 data 
                const enriched = await Promise.all(vectorMatches.matches.map(async (match) => {
                    // Extract lesson number from ID (e.g., "L01" -> 1) 
                    const lessonNumber = parseInt(match.id.substring(1));
                    const lesson = await getLessonById(env.D1, lessonNumber);
                    let relationships = [];
                    if (body.includeRelationships && lesson) {
                        relationships = await getRelationships(env.D1, lessonNumber);
                    }
                    return {
                        score: match.score,
                        lesson: lesson,
                        ...(body.includeRelationships && { relationships }),
                        metadata: match.metadata || {}
                    };
                }));
                return Response.json({
                    query: body.query,
                    results: enriched,
                    count: enriched.length
                }, { headers: corsHeaders });
            }
            catch (error) {
                console.error('Query failed:', error);
                return Response.json({ error: 'Internal server error', details: error.message }, { status: 500, headers: corsHeaders });
            }
        }
        // Route: GET /health - Health check 
        if (url.pathname === '/health') {
            return Response.json({
                status: 'operational',
                timestamp: new Date().toISOString(),
                bindings: {
                    vectorize: !!env.VECTORIZE,
                    d1: !!env.D1,
                    ai: !!env.AI
                }
            }, { headers: corsHeaders });
        }
        return Response.json({ error: 'Not found' }, { status: 404, headers: corsHeaders });
    }
};
