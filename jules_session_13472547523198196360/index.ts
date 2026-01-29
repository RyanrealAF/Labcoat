import { Env, QueryRequest, EnrichedResult, Relationship } from './types';
import { generateEmbedding, queryVectorize } from './vectorize';
import { getLessonById, getRelationships } from './d1';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    // Check Kill Switch (with fail-open if D1 is down for config)
    try {
      const apiStatus = await env.D1.prepare("SELECT value FROM config WHERE key = 'api_enabled'").first<{value: string}>();
      if (apiStatus?.value === '0') {
        return new Response(JSON.stringify({ error: 'System under maintenance / Emergency Shutdown' }), { 
          status: 503, 
          headers: corsHeaders 
        });
      }
    } catch (e) {
      console.error("Config check failed:", e);
    }

    // Route: POST /query - Semantic search
    if (url.pathname === '/query' && request.method === 'POST') {
      try {
        const body: QueryRequest = await request.json();

        // Non-blocking Log Query for Sentinel
        const ip = request.headers.get('cf-connecting-ip') || '0.0.0.0';
        ctx.waitUntil(env.D1.prepare("INSERT INTO query_log (ip, query) VALUES (?, ?)").bind(ip, body.query || '').run().catch(e => {
          console.error("Failed to log query:", e);
        }));

        if (!body.query) {
          return Response.json(
            { error: 'Missing query parameter' },
            { status: 400, headers: corsHeaders }
          );
        }

        // 1. Generate embedding for query
        console.log(`Generating embedding for: "${body.query}"`);
        const embedding = await generateEmbedding(env.AI, body.query);

        // 2. Query Vectorize
        console.log(`Querying Vectorize (topK: ${body.topK || 10})`);
        const vectorMatches = await queryVectorize(
          env.VECTORIZE,
          embedding,
          body.topK || 10
        );

        // 3. Enrich with D1 data
        const enriched: EnrichedResult[] = await Promise.all(
          vectorMatches.matches.map(async (match) => {
            // Extract lesson number from ID (e.g., "L01" -> 1)
            const lessonNumber = parseInt(match.id.substring(1));

            const lesson = await getLessonById(env.D1, lessonNumber);

            let relationships: Relationship[] = [];
            if (body.includeRelationships && lesson) {
              relationships = await getRelationships(env.D1, lessonNumber);
            }

            return {
              score: match.score,
              lesson: lesson!,
              ...(body.includeRelationships && { relationships }),
              metadata: match.metadata || {}
            };
          })
        );

        return Response.json(
          {
            query: body.query,
            results: enriched,
            count: enriched.length
          },
          { headers: corsHeaders }
        );

      } catch (error) {
        console.error('Query failed:', error);
        return Response.json(
          { error: 'Internal server error', details: (error as Error).message },
          { status: 500, headers: corsHeaders }
        );
      }
    }

    // Route: GET /health - Health check
    if (url.pathname === '/health') {
      return Response.json(
        {
          status: 'operational',
          timestamp: new Date().toISOString(),
          bindings: {
            vectorize: !!env.VECTORIZE,
            d1: !!env.D1,
            ai: !!env.AI
          }
        },
        { headers: corsHeaders }
      );
    }

    return Response.json(
      { error: 'Not found' },
      { status: 404, headers: corsHeaders }
    );
  }
};
