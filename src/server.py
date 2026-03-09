import os
import shutil
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json

from fetcher import fetch_arxiv_papers
from ingester import ingest_pdfs
from extractor import process_all_markdowns

app = FastAPI(title="OptoNet ArXiv Pipeline API")

# Configure CORS so the React frontend can talk to the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ExtractRequest(BaseModel):
    url: str

def clean_directory(dir_path):
    """Utility to clear out a directory before a new run."""
    if os.path.exists(dir_path):
        for filename in os.listdir(dir_path):
            file_path = os.path.join(dir_path, filename)
            try:
                if os.path.isfile(file_path) or os.path.islink(file_path):
                    os.unlink(file_path)
                elif os.path.isdir(file_path):
                    shutil.rmtree(file_path)
            except Exception as e:
                print(f'Failed to delete {file_path}. Reason: {e}')
    else:
        os.makedirs(dir_path)

@app.post("/api/extract")
async def extract_arxiv_data(request: ExtractRequest):
    url = request.url
    if not url or "arxiv.org" not in url:
        raise HTTPException(status_code=400, detail="Please provide a valid ArXiv URL (e.g., https://arxiv.org/abs/1005.3196)")

    # Clean directories for a fresh run
    clean_directory("data/raw")
    clean_directory("data/processed")
    clean_directory("data/output")

    try:
        # STEP 1: Fetch
        print(f"Server processing pipeline for URL: {url}")
        results = fetch_arxiv_papers(query=url, max_results=1, download_dir="data/raw")
        if not results:
             raise HTTPException(status_code=404, detail="Could not find or download PDF for the provided ArXiv URL.")
             
        # STEP 2: Ingest
        ingest_results = ingest_pdfs(input_dir="data/raw", output_dir="data/processed")
        
        # STEP 3: Extract
        process_all_markdowns(input_dir="data/processed", output_dir="data/output")
        
        # Parse and return results
        success_data = []
        failure_data = []
        
        results_path = "data/output/results.json"
        failures_path = "data/output/failure_report.json"
        
        if os.path.exists(results_path):
            with open(results_path, "r", encoding="utf-8") as f:
                success_data = json.load(f)
                
        if os.path.exists(failures_path):
            with open(failures_path, "r", encoding="utf-8") as f:
                failure_data = json.load(f)
                
        return {
            "success": True,
            "data": success_data,
            "failures": failure_data,
            "message": "Pipeline completed successfully."
        }
        
    except Exception as e:
        print(f"Pipeline error: {e}")
        raise HTTPException(status_code=500, detail=f"Pipeline execution failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    # Start server on port 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)
