import os
import re
import arxiv

def fetch_arxiv_papers(query="abs:\"high energy physics\" AND abs:table", max_results=5, download_dir="data/raw"):
    """
    Fetches papers from arXiv based on a query and downloads their PDFs.
    """
    if not os.path.exists(download_dir):
        os.makedirs(download_dir)

    print(f"Searching arXiv for: {query}")
    
    # Check if the query is a URL
    url_match = re.search(r'arxiv\.org/(?:abs|pdf)/(\d+\.\d+)(?:v\d+)?(?:\.pdf)?', query)
    if url_match:
        arxiv_id = url_match.group(1)
        print(f"  Detected ArXiv URL. Extracted ID: {arxiv_id}")
        search = arxiv.Search(
            id_list=[arxiv_id],
            max_results=1
        )
    else:
        # It's a regular query
        search = arxiv.Search(
            id_list=[query] if "v" in query else None,
            query=query if "v" not in query else None,
            max_results=max_results,
            sort_by=arxiv.SortCriterion.Relevance
        )

    results = []
    client = arxiv.Client()
    
    for idx, result in enumerate(client.results(search)):
        safe_title = "".join([c for c in result.title if c.isalpha() or c.isdigit() or c==' ']).rstrip()
        filename = f"{result.get_short_id()}_{safe_title[:30].replace(' ', '_')}.pdf"
        filepath = os.path.join(download_dir, filename)
        
        print(f"[{idx+1}/{max_results}] Downloading: {result.title}")
        print(f"  ID: {result.get_short_id()}")
        
        # Download the PDF
        try:
            result.download_pdf(dirpath=download_dir, filename=filename)
            print(f"  Successfully saved to {filepath}")
            results.append({
                "id": result.get_short_id(),
                "title": result.title,
                "filepath": filepath,
                "summary": result.summary
            })
        except Exception as e:
            print(f"  Failed to download {result.get_short_id()}: {e}")
            
    return results

if __name__ == "__main__":
    import sys
    
    # Process explicitly passed paper IDs or fallback to defaults
    if len(sys.argv) > 1:
        search_queries = sys.argv[1:]
    else:
        search_queries = [
            "cat:hep-ex AND abs:data AND abs:table",
            "cat:hep-ph AND abs:measurement"
        ]
    
    all_results = []
    for q in search_queries:
        res = fetch_arxiv_papers(query=q, max_results=1 if len(sys.argv) > 1 else 3, download_dir="data/raw")
        all_results.extend(res)
        
    print(f"\nTotal papers downloaded: {len(all_results)}")
