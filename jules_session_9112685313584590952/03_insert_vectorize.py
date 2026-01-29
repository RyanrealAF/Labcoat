#!/usr/bin/env python3 
""" 
Vectorize Insertion Pipeline 
Inserts pre-generated embeddings into Cloudflare Vectorize with retry logic. 
""" 
 
import json 
import os 
import time 
import requests 
from typing import Dict, List 
from pathlib import Path 
 
# Configuration 
ACCOUNT_ID = os.getenv("CLOUDFLARE_ACCOUNT_ID") 
API_TOKEN = os.getenv("CLOUDFLARE_API_TOKEN") 
INDEX_NAME = "fractal-curriculum-prod" 
VECTORIZE_API = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/vectorize/v2/indexes/{INDEX_NAME}/insert" 
 
# Batch insertion settings 
BATCH_SIZE = 100  # Vectorize supports up to 1000 vectors per request 
MAX_RETRIES = 3 
RETRY_DELAY = 5  # seconds 
 
 
class VectorizeInserter: 
    def __init__(self): 
        self.headers = { 
            "Authorization": f"Bearer {API_TOKEN}", 
            "Content-Type": "application/json" 
        } 
        self.inserted_count = 0 
        self.failed_ids = [] 
     
    def insert_batch(self, vectors: List[Dict], retry_count: int = 0) -> bool: 
        """ 
        Insert batch of vectors into Vectorize 
        Format: [{"id": "L01", "values": [768 floats], "metadata": {...}}] 
        """ 
        try: 
            response = requests.post( 
                VECTORIZE_API, 
                headers=self.headers, 
                json={"vectors": vectors}, 
                timeout=60 
            ) 
            response.raise_for_status() 
             
            result = response.json() 
            if result.get("success"): 
                self.inserted_count += len(vectors) 
                print(f"✅ Inserted batch of {len(vectors)} vectors") 
                return True 
            else: 
                print(f"⚠️ API returned success=false: {result}") 
                return False 
                 
        except Exception as e: 
            print(f"❌ Insertion failed (attempt {retry_count + 1}/{MAX_RETRIES}): {e}") 
             
            if retry_count < MAX_RETRIES: 
                print(f"⏳ Retrying in {RETRY_DELAY}s...") 
                time.sleep(RETRY_DELAY) 
                return self.insert_batch(vectors, retry_count + 1) 
             
            # Max retries exceeded 
            for vec in vectors: 
                self.failed_ids.append(vec['id']) 
            return False 
     
    def insert_all(self, embeddings_cache: Dict): 
        """ 
        Insert all embeddings in batches 
        """ 
        lesson_ids = list(embeddings_cache.keys()) 
        total = len(lesson_ids) 
         
        print(f"\n🚀 Inserting {total} vectors into Vectorize...") 
        print(f"{'='*60}") 
         
        # Process in batches 
        for i in range(0, total, BATCH_SIZE): 
            batch_ids = lesson_ids[i:i + BATCH_SIZE] 
            batch_vectors = [] 
             
            for lesson_id in batch_ids: 
                data = embeddings_cache[lesson_id] 
                batch_vectors.append({ 
                    "id": lesson_id, 
                    "values": data["vector"], 
                    "metadata": data["metadata"] 
                }) 
             
            print(f"\n📦 Batch {i//BATCH_SIZE + 1}: {len(batch_vectors)} vectors") 
            success = self.insert_batch(batch_vectors) 
             
            if not success: 
                print(f"⚠️ Batch insertion partially failed") 
             
            # Rate limiting between batches 
            if i + BATCH_SIZE < total: 
                time.sleep(1) 
         
        print(f"\n{'='*60}") 
        print(f"📊 Insertion Summary:") 
        print(f"   ✅ Inserted:  {self.inserted_count}/{total}") 
        print(f"   ❌ Failed:    {len(self.failed_ids)}") 
         
        if self.failed_ids: 
            print(f"\n⚠️ Failed IDs: {', '.join(self.failed_ids)}") 
         
        print(f"{'='*60}\n") 
 
 
def main(): 
    # Load cached embeddings 
    cache_file = Path("data/embeddings/lesson_vectors.json") 
    if not cache_file.exists(): 
        print("❌ Embeddings cache not found!") 
        print("   Run 02_batch_embed.py first") 
        return 
     
    with open(cache_file) as f: 
        embeddings_cache = json.load(f) 
     
    if not embeddings_cache: 
        print("❌ No embeddings found in cache!") 
        return 
     
    print(f""" 
╔═══════════════════════════════════════════════════════════╗ 
║  VECTORIZE INSERTION PIPELINE                             ║ 
║  Index: {INDEX_NAME:47s}║ 
║  Vectors: {len(embeddings_cache):3d}                                              ║ 
╚═══════════════════════════════════════════════════════════╝ 
    """) 
     
    # Insert 
    inserter = VectorizeInserter() 
    inserter.insert_all(embeddings_cache) 
     
    print("\n🎯 Vectorize insertion complete.\n") 
 
 
if __name__ == "__main__": 
    if not ACCOUNT_ID or not API_TOKEN: 
        print("❌ Missing environment variables:") 
        print("   Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN") 
        exit(1) 
     
    main() 
