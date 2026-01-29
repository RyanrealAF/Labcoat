#!/bin/bash 
set -e 
 
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" 
echo "🚀 FRACTAL CURRICULUM FULL DEPLOYMENT PIPELINE" 
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" 
 
# Step 1: Create indexes (if not exist) 
echo "" 
echo "Step 1/5: Index Creation" 
cd tools/vectorize 
bash 01_create_index.sh || echo "⚠️ Indexes may already exist" 
cd ../.. 
 
# Step 2: Generate embeddings 
echo "" 
echo "Step 2/5: Embedding Generation" 
cd tools/vectorize 
python3 02_batch_embed.py 
cd ../.. 
 
# Step 3: Insert into Vectorize 
echo "" 
echo "Step 3/5: Vectorize Insertion" 
cd tools/migration 
python3 03_insert_vectorize.py 
cd ../.. 
 
# Step 4: Deploy Worker 
echo "" 
echo "Step 4/5: Worker Deployment" 
cd workers/curriculum-api 
npm install 
npx wrangler deploy 
cd ../.. 
 
# Step 5: Validation 
echo "" 
echo "Step 5/5: Integration Testing" 
sleep 5  # Let Worker propagate 
cd tools/vectorize 
python3 04_test_queries.py 
cd ../.. 
 
echo "" 
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" 
echo "✅ DEPLOYMENT COMPLETE" 
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" 
echo "" 
echo "📡 Your API is live at:" 
echo "   https://curriculum-api.buildwhilebleeding.workers.dev" 
echo "" 
echo "🔍 Test it:" 
echo "   curl -X POST https://curriculum-api.buildwhilebleeding.workers.dev/query \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{\"query\": \"institutional weaponization\", \"topK\": 5}'" 
echo "" 
