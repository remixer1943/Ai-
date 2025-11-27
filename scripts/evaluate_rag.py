#!/usr/bin/env python3
"""Lightweight RAG pipeline evaluation tool."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import List, Dict

from rag_service import RAGConfig, VectorStoreRetriever


def precision_at_k(retrieved: List[str], relevant: List[str], k: int) -> float:
    if k == 0:
        return 0.0
    hits = sum(1 for doc_id in retrieved[:k] if doc_id in relevant)
    return hits / k


def evaluate(dataset_path: Path, top_k: int) -> Dict[str, float]:
    with open(dataset_path, 'r') as f:
        dataset = json.load(f)

    retriever = VectorStoreRetriever(RAGConfig())
    retriever.load()

    scores = []
    for sample in dataset:
        query = sample['query']
        relevant = sample.get('relevant_ids', [])
        chunks = retriever.retrieve(query, top_k)
        retrieved_ids = [chunk['id'] for chunk in chunks]
        scores.append(precision_at_k(retrieved_ids, relevant, min(top_k, len(retrieved_ids))))

    return {
        'precision_at_k': sum(scores) / len(scores) if scores else 0.0,
        'samples': len(scores)
    }


def main():
    parser = argparse.ArgumentParser(description='Evaluate RAG retrieval quality using a labeled dataset.')
    parser.add_argument('--dataset', required=True, help='Path to JSON dataset with query and relevant_ids fields')
    parser.add_argument('--k', type=int, default=5, help='Top-K for precision calculation')
    args = parser.parse_args()

    metrics = evaluate(Path(args.dataset), args.k)
    print(json.dumps(metrics, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
