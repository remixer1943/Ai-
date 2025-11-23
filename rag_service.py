#!/usr/bin/env python3
"""
RAG Retrieval Service for AI助教
Provides semantic search over the knowledge base using BGE embeddings.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from sentence_transformers import SentenceTransformer
import pickle
import numpy as np
from pathlib import Path
import torch

# Paths
PROJECT_ROOT = Path(__file__).resolve().parent
MODEL_PATH = PROJECT_ROOT / "models/bge-large-zh-v1.5"
VECTOR_STORE_PATH = PROJECT_ROOT / "src/data/vector_store.pkl"

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests

# Global variables for model and vector store
model = None
vector_store = None

def load_resources():
    """Load the BGE model and vector store on startup."""
    global model, vector_store
    
    print(f"Loading BGE model from {MODEL_PATH}...")
    model = SentenceTransformer(str(MODEL_PATH))
    
    print(f"Loading vector store from {VECTOR_STORE_PATH}...")
    with open(VECTOR_STORE_PATH, 'rb') as f:
        vector_store = pickle.load(f)
    
    print(f"Ready! Vector store contains {len(vector_store['chunks'])} chunks.")

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({"status": "ok", "model_loaded": model is not None})

@app.route('/retrieve', methods=['POST'])
def retrieve():
    """
    Retrieve relevant knowledge chunks based on query.
    
    Request body:
    {
        "query": "observation text",
        "top_k": 5  (optional, default 5)
    }
    
    Response:
    {
        "chunks": [
            {"id": "chunk-1", "text": "...", "source": "...", "score": 0.85},
            ...
        ]
    }
    """
    try:
        data = request.json
        query = data.get('query', '')
        top_k = data.get('top_k', 5)
        
        if not query:
            return jsonify({"error": "Query is required"}), 400
        
        # For BGE model, queries should use instruction prefix for better performance
        # https://huggingface.co/BAAI/bge-large-zh-v1.5
        instruction = "为这个句子生成表示以用于检索相关文章："
        query_with_instruction = instruction + query
        
        # Generate query embedding
        query_embedding = model.encode([query_with_instruction], normalize_embeddings=True)[0]
        
        # Compute cosine similarity with all chunk embeddings
        embeddings = vector_store['embeddings']
        similarities = np.dot(embeddings, query_embedding)
        
        # Get top-k indices
        top_indices = np.argsort(similarities)[::-1][:top_k]
        
        # Prepare results
        results = []
        for idx in top_indices:
            chunk = vector_store['chunks'][idx]
            results.append({
                'id': chunk['id'],
                'text': chunk['text'],
                'source': chunk['source'],
                'score': float(similarities[idx])
            })
        
        return jsonify({"chunks": results})
    
    except Exception as e:
        print(f"Error in /retrieve: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    load_resources()
    # Run on port 5001 to avoid conflicts with Vite dev server (3000)
    print("\n🚀 RAG Retrieval Service starting on http://localhost:5001")
    print("   Use Ctrl+C to stop\n")
    app.run(host='0.0.0.0', port=5001, debug=False)
