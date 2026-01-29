#!/usr/bin/env python3 
""" 
Batch Embedding Generator for Fractal Curriculum 
Generates 768-dimensional embeddings for all 120 lessons using Workers AI. 
""" 
 
import json 
import os 
import time 
import requests 
import hashlib
from typing import Dict, List, Optional 
from pathlib import Path 
 
# Configuration 
ACCOUNT_ID = os.getenv("CLOUDFLARE_ACCOUNT_ID") 
API_TOKEN = os.getenv("CLOUDFLARE_API_TOKEN") 
WORKERS_AI_ENDPOINT = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/ai/run/@cf/baai/bge-base-en-v1.5" 
 
# Rate limiting (respect Cloudflare's limits) 
REQUESTS_PER_MINUTE = 50 
BATCH_SIZE = 10 
 
class EmbeddingGenerator: 
    def __init__(self): 
        self.headers = { 
            "Authorization": f"Bearer {API_TOKEN}", 
            "Content-Type": "application/json" 
        } 
        self.embeddings_cache = {} 
        self.cache_file = Path("data/embeddings/lesson_vectors.json") 
        self._load_cache() 
     
    def _load_cache(self): 
        """Load existing embeddings to avoid regenerating""" 
        if self.cache_file.exists(): 
            with open(self.cache_file) as f: 
                self.embeddings_cache = json.load(f) 
            print(f"📦 Loaded {len(self.embeddings_cache)} cached embeddings") 
     
    def _save_cache(self): 
        """Persist embeddings to disk""" 
        self.cache_file.parent.mkdir(parents=True, exist_ok=True) 
        with open(self.cache_file, 'w') as f: 
            json.dump(self.embeddings_cache, f, indent=2) 
        print(f"💾 Saved {len(self.embeddings_cache)} embeddings to cache") 

    def _save_source_hash(self):
        """Save hash of the curriculum.ts source"""
        source_path = Path("../../src/data/curriculum.ts")
        if source_path.exists():
            sha256_hash = hashlib.sha256()
            with open(source_path, "rb") as f:
                for byte_block in iter(lambda: f.read(4096), b""):
                    sha256_hash.update(byte_block)
            
            hash_file = self.cache_file.with_suffix(".json.hash")
            with open(hash_file, "w") as f:
                f.write(sha256_hash.hexdigest())
            print(f"🔒 Saved source hash to {hash_file}")
     
    def generate_embedding(self, text: str) -> Optional[List[float]]: 
        """ 
        Generate 768-dimensional embedding for text 
        Returns None on failure 
        """ 
        try: 
            response = requests.post( 
                WORKERS_AI_ENDPOINT, 
                headers=self.headers, 
                json={"text": [text]}, 
                timeout=30 
            ) 
            response.raise_for_status() 
             
            result = response.json() 
            if result.get("success") and "result" in result: 
                # Workers AI returns shape: {"data": [[768 floats]]} 
                return result["result"]["data"][0] 
             
            print(f"⚠️ Unexpected response format: {result}") 
            return None 
             
        except Exception as e: 
            print(f"❌ Embedding generation failed: {e}") 
            return None 
     
    def create_lesson_text(self, lesson: Dict) -> str: 
        """ 
        Construct rich text representation for embedding 
        Format: "TITLE | CONCEPT | VALIDATOR | PHASE" 
        """ 
        return ( 
            f"{lesson['title']} | " 
            f"{lesson['tacticalConcept']} | " 
            f"{lesson['historicalValidator']} | " 
            f"Phase: {lesson.get('phase', 'UNKNOWN')}" 
        ) 
     
    def batch_embed_lessons(self, lessons: List[Dict], force_regen: bool = False): 
        """ 
        Embed all lessons with rate limiting and caching 
        """ 
        print(f"\n🔨 Starting batch embedding of {len(lessons)} lessons") 
        print(f"{'='*60}") 
         
        embedded = 0 
        skipped = 0 
        failed = 0 
         
        for i, lesson in enumerate(lessons, 1): 
            lesson_id = lesson['id'] 
             
            # Check cache 
            if lesson_id in self.embeddings_cache and not force_regen: 
                skipped += 1 
                print(f"⏭️  [{i}/{len(lessons)}] {lesson_id}: cached") 
                continue 
             
            # Generate embedding 
            lesson_text = self.create_lesson_text(lesson) 
            print(f"🔄 [{i}/{len(lessons)}] {lesson_id}: generating...") 
             
            embedding = self.generate_embedding(lesson_text) 
             
            if embedding: 
                self.embeddings_cache[lesson_id] = { 
                    "vector": embedding, 
                    "text": lesson_text, 
                    "metadata": { 
                        "title": lesson['title'], 
                        "phase": lesson.get('phase'), 
                        "module_id": lesson.get('moduleId'), 
                        "concept": lesson['tacticalConcept'] 
                    } 
                } 
                embedded += 1 
                print(f"✅ [{i}/{len(lessons)}] {lesson_id}: complete") 
            else: 
                failed += 1 
                print(f"❌ [{i}/{len(lessons)}] {lesson_id}: FAILED") 
             
            # Rate limiting 
            if i % BATCH_SIZE == 0: 
                print(f"\n⏸️  Rate limit pause (processed {i}/{len(lessons)})...\n") 
                time.sleep(60 / REQUESTS_PER_MINUTE * BATCH_SIZE) 
             
            # Save progress every 20 lessons 
            if i % 20 == 0: 
                self._save_cache() 
         
        # Final save 
        self._save_cache() 
        
        # Save source hash for validation
        self._save_source_hash()
         
        print(f"\n{'='*60}") 
        print(f"📊 Embedding Summary:") 
        print(f"   ✅ Generated: {embedded}") 
        print(f"   ⏭️  Cached:    {skipped}") 
        print(f"   ❌ Failed:    {failed}") 
        print(f"{'='*60}\n") 
 
 
def main(): 
    # Load curriculum 
    curriculum_path = Path("data/curriculum.json") 
    if not curriculum_path.exists(): 
        print("❌ curriculum.json not found!") 
        return 
     
    with open(curriculum_path) as f: 
        curriculum = json.load(f) 
     
    lessons = curriculum.get("lessons", []) 
    if not lessons: 
        print("❌ No lessons found in curriculum!") 
        return 
     
    print(f""" 
╔═══════════════════════════════════════════════════════════╗ 
║  FRACTAL CURRICULUM EMBEDDING PIPELINE                    ║ 
║  120 Lessons → 768-Dimensional Semantic Vectors           ║ 
╚═══════════════════════════════════════════════════════════╝ 
    """) 
     
    # Initialize generator 
    generator = EmbeddingGenerator() 
     
    # Batch embed 
    generator.batch_embed_lessons(lessons, force_regen=False) 
     
    print("\n🎯 Embedding pipeline complete. Ready for Vectorize insertion.\n") 
 
 
if __name__ == "__main__": 
    if not ACCOUNT_ID or not API_TOKEN: 
        print("❌ Missing environment variables:") 
        print("   Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN") 
        exit(1) 
     
    main() 
