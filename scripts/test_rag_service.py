#!/usr/bin/env python3
"""
Test script for RAG retrieval service.
"""

import requests
import json

def test_rag_service():
    print("=" * 60)
    print("Testing RAG Retrieval Service")
    print("=" * 60)
    
    # Test 1: Health check
    print("\n[Test 1] Health check...")
    try:
        response = requests.get('http://localhost:5001/health')
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Error: {e}")
        return
    
    # Test 2: Retrieve with a query about health
    print("\n[Test 2] Query about health (健康)...")
    query = "孩子每天睡觉的时间很规律,早睡早起,吃饭也很好"
    try:
        response = requests.post('http://localhost:5001/retrieve', 
                                json={"query": query, "top_k": 3})
        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"\nFound {len(data['chunks'])} relevant chunks:")
        for i, chunk in enumerate(data['chunks'], 1):
            print(f"\n--- Chunk {i} (Score: {chunk['score']:.3f}) ---")
            print(f"ID: {chunk['id']}")
            print(f"Source: {chunk['source']}")
            print(f"Text preview: {chunk['text'][:100]}...")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test 3: Retrieve with a query about language
    print("\n[Test 3] Query about language (语言)...")
    query = "孩子喜欢听故事,会复述给别人听"
    try:
        response = requests.post('http://localhost:5001/retrieve', 
                                json={"query": query, "top_k": 3})
        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"\nFound {len(data['chunks'])} relevant chunks:")
        for i, chunk in enumerate(data['chunks'], 1):
            print(f"\n--- Chunk {i} (Score: {chunk['score']:.3f}) ---")
            print(f"ID: {chunk['id']}")
            print(f"Source: {chunk['source']}")
            print(f"Text preview: {chunk['text'][:100]}...")
    except Exception as e:
        print(f"Error: {e}")
    
    print("\n" + "=" * 60)
    print("Tests complete!")
    print("=" * 60)

if __name__ == "__main__":
    test_rag_service()
