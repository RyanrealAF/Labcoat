#!/bin/bash 
set -e 
 
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" 
echo "🔨 CREATING FRACTAL CURRICULUM VECTORIZE INDEX" 
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" 
 
# Production index (cosine metric for semantic similarity) 
npx wrangler vectorize create fractal-curriculum-prod \
  --dimensions=768 \
  --metric=cosine 
 
echo "✅ Production index created: fractal-curriculum-prod" 
 
# Dev/staging index (for testing before prod deployment) 
npx wrangler vectorize create fractal-curriculum-dev \
  --dimensions=768 \
  --metric=cosine 
 
echo "✅ Dev index created: fractal-curriculum-dev" 
 
# Verify creation 
echo "" 
echo "📊 Verifying indexes..." 
npx wrangler vectorize list 
 
echo "" 
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" 
echo "🎯 Index creation complete. Ready for embedding." 
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" 
