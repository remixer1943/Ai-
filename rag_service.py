#!/usr/bin/env python3
"""Structured RAG Retrieval Service for AI助教."""

from dataclasses import dataclass
from typing import List, Dict, Any, Optional
from pathlib import Path
import pickle
import numpy as np
from flask import Flask, request, jsonify, Blueprint
from flask_cors import CORS
from sentence_transformers import SentenceTransformer


PROJECT_ROOT = Path(__file__).resolve().parent
MODEL_PATH = PROJECT_ROOT / "models/bge-large-zh-v1.5"
VECTOR_STORE_PATH = PROJECT_ROOT / "src/data/vector_store.pkl"


@dataclass
class RAGConfig:
    model_path: Path = MODEL_PATH
    vector_store_path: Path = VECTOR_STORE_PATH
    top_k_default: int = 5


class VectorStoreRetriever:
    def __init__(self, config: RAGConfig):
        self.config = config
        self.model: Optional[SentenceTransformer] = None
        self.vector_store: Optional[Dict[str, Any]] = None

    def load(self) -> None:
        if self.model and self.vector_store:
            return
        self.model = SentenceTransformer(str(self.config.model_path))
        with open(self.config.vector_store_path, 'rb') as f:
            self.vector_store = pickle.load(f)

    def retrieve(self, query: str, top_k: int) -> List[Dict[str, Any]]:
        if not self.model or not self.vector_store:
            raise RuntimeError('Retriever not initialized')

        instruction = "为这个句子生成表示以用于检索相关文章："
        query_embedding = self.model.encode([instruction + query], normalize_embeddings=True)[0]
        embeddings = self.vector_store['embeddings']
        similarities = np.dot(embeddings, query_embedding)
        top_indices = np.argsort(similarities)[::-1][:top_k]

        results = []
        for idx in top_indices:
            chunk = self.vector_store['chunks'][idx]
            results.append({
                'id': chunk['id'],
                'text': chunk['text'],
                'source': chunk['source'],
                'score': float(similarities[idx])
            })
        return results


def create_app(config: Optional[RAGConfig] = None) -> Flask:
    cfg = config or RAGConfig()
    retriever = VectorStoreRetriever(cfg)
    retriever.load()

    app = Flask(__name__)
    CORS(app)
    bp = Blueprint('rag', __name__)

    @bp.route('/health', methods=['GET'])
    def health_check():
        return jsonify({"status": "ok", "chunks": len(retriever.vector_store['chunks'])})

    @bp.route('/retrieve', methods=['POST'])
    def retrieve_endpoint():
        payload = request.get_json(force=True, silent=True) or {}
        query = payload.get('query')
        top_k = int(payload.get('top_k', cfg.top_k_default))
        if not query:
            return jsonify({"error": "Query is required"}), 400
        try:
            chunks = retriever.retrieve(query, top_k)
            return jsonify({"chunks": chunks})
        except Exception as exc:  # pragma: no cover - logged below
            app.logger.exception('RAG retrieval failed')
            return jsonify({"error": str(exc)}), 500

    @app.errorhandler(Exception)
    def handle_exception(error):  # pragma: no cover - fallback handler
        app.logger.exception('Unhandled exception: %s', error)
        return jsonify({"error": "Internal server error"}), 500

    app.register_blueprint(bp)
    return app


if __name__ == '__main__':
    application = create_app()
    application.logger.info('🚀 RAG Retrieval Service starting on http://localhost:5001')
    application.run(host='0.0.0.0', port=5001, debug=False)
