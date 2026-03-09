import os
import sys
from fetcher import fetch_arxiv_papers
from ingester import ingest_pdfs
from extractor import process_all_markdowns

def run_pipeline():
    print("=========================================")
    print("  OptoNet ArXiv Extraction Pipeline   ")
    print("=========================================\n")

    # STEP 1: Fetch Data
    print("\n--- STEP 1: Fetching ArXiv Papers ---")
    
    if len(sys.argv) > 1:
        queries = sys.argv[1:]
        max_results = 1
    else:
        queries = [
            "cat:hep-ex AND abs:data AND abs:table",
            "cat:hep-ph AND abs:measurement"
        ]
        max_results = 2
    
    total_fetched = 0
    for q in queries:
        # Fetch 2 papers per query for the demo to save time/tokens (or 1 if specific target)
        results = fetch_arxiv_papers(query=q, max_results=max_results, download_dir="data/raw")
        total_fetched += len(results)
        
    print(f"Fetch complete. {total_fetched} papers downloaded.")
    
    # STEP 2: Ingest PDFs
    print("\n--- STEP 2: Ingesting PDFs via Docling ---")
    ingest_results = ingest_pdfs(input_dir="data/raw", output_dir="data/processed")
    success = sum(1 for r in ingest_results if r["status"] == "success") if ingest_results else 0
    print(f"Ingestion complete. {success} PDFs converted to Markdown.")
    
    # STEP 3: Extract Structured Data
    print("\n--- STEP 3: LLM Schema Extraction ---")
    process_all_markdowns(input_dir="data/processed", output_dir="data/output")
    
    print("\n=====================================")
    print("        Pipeline Run Complete        ")
    print(" Check data/output/ for the results! ")
    print("=====================================")

if __name__ == "__main__":
    run_pipeline()
