import json
import os
import math
import sys

def dot_product(v1, v2):
    return sum(x * y for x, y in zip(v1, v2))

def magnitude(v):
    return math.sqrt(sum(x * x for x in v))

def cosine_similarity(v1, v2):
    m1 = magnitude(v1)
    m2 = magnitude(v2)
    if m1 == 0 or m2 == 0:
        return 0
    return dot_product(v1, v2) / (m1 * m2)

def measure_semantic_drift():
    """Compare current embeddings vs. golden snapshot as per Sentinel Spec"""
    print("--- Sentinel Semantic Drift Analyzer ---")
    golden_path = 'backups/vectors_snapshot_v1.0.json'
    current_path = 'backend/data/embeddings/lesson_vectors.json'

    if not os.path.exists(golden_path):
        print(f"❌ Error: Golden snapshot missing at {golden_path}")
        return False
    
    if not os.path.exists(current_path):
        print(f"❌ Error: Current embeddings missing at {current_path}")
        return False

    try:
        with open(golden_path, 'r') as f:
            golden = json.load(f)
        with open(current_path, 'r') as f:
            current = json.load(f)
    except Exception as e:
        print(f"❌ Error loading JSON: {e}")
        return False

    drift_scores = {}
    for lesson_id in golden.keys():
        if lesson_id in current:
            score = cosine_similarity(golden[lesson_id], current[lesson_id])
            drift_scores[lesson_id] = score
        else:
            print(f"⚠️ Warning: Lesson {lesson_id} missing from current embeddings.")
            drift_scores[lesson_id] = 0.0

    critical = [k for k, v in drift_scores.items() if v < 0.85]
    
    if critical:
        print(f"🚨 SEMANTIC CORRUPTION DETECTED in lessons: {critical}")
        # In a real environment, this would trigger an alert to Slack/Email
        return False
    else:
        print("✅ PASS: No significant semantic drift detected.")
        return True

if __name__ == "__main__":
    if not measure_semantic_drift():
        sys.exit(1)
