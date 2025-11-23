
import json
import os
import torch
from sentence_transformers import SentenceTransformer
import pickle
from pathlib import Path

# Paths
CURRENT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = CURRENT_DIR.parent
KNOWLEDGE_BASE_PATH = PROJECT_ROOT / "src/data/knowledge_base.json"
MODEL_PATH = PROJECT_ROOT / "models/bge-large-zh-v1.5"
VECTOR_STORE_PATH = PROJECT_ROOT / "src/data/vector_store.pkl"

def build_vector_db():
    print(f"Loading knowledge base from {KNOWLEDGE_BASE_PATH}...")
    if not KNOWLEDGE_BASE_PATH.exists():
        print(f"Error: Knowledge base file not found at {KNOWLEDGE_BASE_PATH}")
        return

    with open(KNOWLEDGE_BASE_PATH, 'r', encoding='utf-8') as f:
        kb_data = json.load(f)

    chunks = kb_data.get('chunks', [])
    print(f"Found {len(chunks)} chunks.")

    print(f"Loading model from {MODEL_PATH}...")
    if not MODEL_PATH.exists():
         print(f"Error: Model not found at {MODEL_PATH}")
         return
    
    # Load model locally
    model = SentenceTransformer(str(MODEL_PATH))
    
    # Prepare texts for embedding
    # BGE model expects "为这个句子生成表示以用于检索相关文章：" instruction for queries, 
    # but for passages (documents), we usually just embed the text directly.
    # However, let's check specific instructions for BGE v1.5. 
    # Usually for BGE, queries need instruction, passages don't.
    texts = [chunk['text'] for chunk in chunks]
    
    print("Generating embeddings...")
    embeddings = model.encode(texts, normalize_embeddings=True, show_progress_bar=True)
    
    # Create store
    vector_store = {
        'chunks': chunks,
        'embeddings': embeddings
    }
    
    print(f"Saving vector store to {VECTOR_STORE_PATH}...")
    with open(VECTOR_STORE_PATH, 'wb') as f:
        pickle.dump(vector_store, f)
        
    print("Vector database built successfully!")

if __name__ == "__main__":
    build_vector_db()
