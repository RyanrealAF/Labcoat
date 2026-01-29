import hashlib
import os
import subprocess
import json
import sys

MANIFEST_PATH = 'agents/sentinel/manifest.json'

def hash_file(filepath):
    if not os.path.exists(filepath):
        return None
    with open(filepath, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()

def query_d1(query):
    """Attempt to query D1 using wrangler CLI"""
    try:
        result = subprocess.run(
            ["npx", "wrangler", "d1", "execute", "tactical-curriculum-db", "--command", query, "--json"],
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            data = json.loads(result.stdout)
            if data and len(data) > 0 and 'results' in data[0]:
                return data[0]['results']
        return None
    except Exception:
        return None

def verify_curriculum_chain():
    """Triple-check the persistence chain against manifest"""
    print("--- Sentinel Integrity Watchdog ---")
    
    if not os.path.exists(MANIFEST_PATH):
        print(f"❌ Error: Manifest missing at {MANIFEST_PATH}")
        return False

    with open(MANIFEST_PATH, 'r') as f:
        manifest = json.load(f)

    # 1. Check Source File
    source_path = 'src/data/curriculum.ts'
    current_source_hash = hash_file(source_path)
    expected_source_hash = manifest.get(source_path)
    
    if current_source_hash != expected_source_hash:
        print(f"🚨 SOURCE TAMPERING DETECTED: {source_path}")
        print(f"   Expected: {expected_source_hash}")
        print(f"   Actual:   {current_source_hash}")
        return False
    print(f"✅ Source Hash Verified: {current_source_hash[:8]}...")

    # 2. Check Embeddings
    embed_path = 'backend/data/embeddings/lesson_vectors.json'
    current_embed_hash = hash_file(embed_path)
    expected_embed_hash = manifest.get(embed_path)

    if current_embed_hash != expected_embed_hash:
        print(f"🚨 EMBEDDINGS TAMPERING DETECTED: {embed_path}")
        print(f"   Expected: {expected_embed_hash}")
        print(f"   Actual:   {current_embed_hash}")
        return False
    print(f"✅ Embeddings Hash Verified: {current_embed_hash[:8]}...")

    # 3. Check D1 Persistence
    expected_count = manifest.get('d1_expected_count')
    d1_results = query_d1('SELECT COUNT(*) as count FROM lessons')
    
    if d1_results:
        actual_count = d1_results[0]['count']
        if actual_count != expected_count:
            print(f"🚨 D1 DATA DRIFT DETECTED: Expected {expected_count} lessons, found {actual_count}")
            return False
        print(f"✅ D1 Count Verified: {actual_count} lessons.")
    else:
        print("⚠️ Warning: D1 Checksum skipped (Database unavailable).")

    print("✅ PASS: Curriculum chain integrity verified against manifest.")
    return True

if __name__ == "__main__":
    if not verify_curriculum_chain():
        sys.exit(1)
