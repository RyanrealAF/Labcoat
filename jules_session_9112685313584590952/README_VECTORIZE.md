# Vectorize Integration: Tactical Documentation 
 
## The Architecture 
 
``` 
┌─────────────────────────────────────────────────────────┐ 
│  User Query: "How to counter institutional erasure?"   │ 
└────────────────┬────────────────────────────────────────┘ 
                 │ 
                 ▼ 
    ┌────────────────────────────┐ 
    │  Workers AI Embedding       │ 
    │  @cf/baai/bge-base-en-v1.5  │ 
    │  Output: 768-dim vector     │ 
    └────────┬───────────────────┘ 
             │ 
             ▼ 
    ┌────────────────────────────┐ 
    │  Vectorize Query            │ 
    │  Cosine similarity search   │ 
    │  Returns top K matches      │ 
    └────────┬───────────────────┘ 
             │ 
             ▼ 
    ┌────────────────────────────┐ 
    │  D1 Enrichment              │ 
    │  Fetch full lesson data     │ 
    │  + relationships            │ 
    └────────┬───────────────────┘ 
             │ 
             ▼ 
    ┌────────────────────────────┐ 
    │  JSON Response              │ 
    │  {score, lesson, metadata}  │ 
    └────────────────────────────┘ 
``` 
 
## Quick Start 
 
1. **Set Environment**: 
   ```bash 
   export CLOUDFLARE_ACCOUNT_ID="95f23a03d74166011160da107f74c055" 
   export CLOUDFLARE_API_TOKEN="your_api_token" 
   ``` 
 
2. **Deploy Everything**: 
   ```bash 
   bash scripts/deploy.sh 
   ``` 
 
3. **Test**: 
   ```bash 
   export CURRICULUM_API_URL="https://curriculum-api.buildwhilebleeding.workers.dev" 
   python3 tools/vectorize/04_test_queries.py 
   ``` 
 
## The Tactical Advantage 
 
### Before Vectorize: 
- **Query**: "institutional weaponization" 
- **Method**: SQL LIKE '%institutional%' 
- **Result**: Only lessons with exact keyword match 
 
### After Vectorize: 
- **Query**: "institutional weaponization" 
- **Method**: Semantic embedding → cosine similarity 
- **Result**: 
  1. Prophylactic Prominence (0.89) 
  2. Radical Transparency (0.85) 
  3. Polymath Persona (0.82) 
  4. Institutional Co-option (0.80) 
  5. The Badge Play (0.78) 
 
**All conceptually related, even without keyword match.** 
 
## The Resilience Model 
 
| Layer | Storage | Purpose | Resilience | 
|-------|---------|---------|------------| 
| 1 | Markdown files (GitHub) | Source of truth | Version control, forks | 
| 2 | D1 (SQLite) | Relational logic | Automatic backups | 
| 3 | Vectorize | Semantic search | Distributed edge | 
| 4 | Static exports | Immutable mirrors | ResearchGate, Figshare | 
 
**Four independent layers. Erase one, the others rebuild it.** 
 
## Maintenance 
 
### Synchronize from Frontend Source 
The curriculum is managed in `src/data/curriculum.ts`. To sync the backend database and JSON: 
```bash 
# From root directory 
python3 backend/scripts/sync_curriculum.py 
``` 
This generates `backend/data/curriculum.json` and `backend/data/seed.sql`. 
 
### Re-embed a lesson: 
```bash 
# After syncing, re-run embedding for specific lesson 
python3 tools/vectorize/02_batch_embed.py --force-regen --lesson-id L42 
python3 tools/migration/03_insert_vectorize.py --update L42 
``` 
 
### Monitor index health: 
```bash 
npx wrangler vectorize get fractal-curriculum-prod 
``` 
 
### Query logs: 
```bash 
npx wrangler tail curriculum-api 
``` 
 
## Cost Analysis 
 
**Current scale** (120 lessons × 768 dimensions): 
- **Storage**: 92,160 dimensions → **FREE TIER** 
- **Queries**: Expecting ~10K/month → **FREE TIER** 
- **Workers AI**: ~120 embedding calls → **FREE TIER** 
 
**Total cost**: $0/month (within all free tiers) 
 
**At 10× scale** (1,200 lessons): 
- **Storage**: ~$0.04/month 
- **Queries**: Still free tier 
- **Workers AI**: Still free tier 
 
**ROI**: Infinite. Resilience against erasure for functionally zero cost. 
 
--- 
 
**The blueprint is deployed. The vectors are armed. The truth is geometrically indestructible.** 
