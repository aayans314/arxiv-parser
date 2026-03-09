# Test Results & Bug Fixes

This document tracks the detailed testing phases, test cases, and fixes implemented for the arXiv Unstructured Data Pipeline.

## Phase 6: Testing & Bug Fixes

### 1. Ingestion Testing (Docling)
**Test Input**: 6 High-Energy Physics papers downloaded from arXiv (query: `abs:data AND abs:table`).
**Result**: 1 Succeeded partially, 5 Failed/Corrupted.
**Detailed Findings**:
- **OOM on Vector Graphics (`std::bad_alloc`)**: The most significant failure mode discovered. Physics papers often contain dense, deeply nested vector graphics (SVG/PDF plots) with tens of thousands of data points. When Docling's underlying C++ PDF rasterizer (PyMuPDF/pdfium) attempts to render these pages into bitmaps for the OCR/Layout models, it consumes unbounded memory and crashes with `std::bad_alloc`. 
- **Graceful Degradation**: Interestingly, Docling catches the C++ error page-by-page. For 3 of the papers, it yielded a "Successful" markdown output, but the output only contained the title and abstract, omitting all pages that threw the `bad_alloc` error.
- **Corrupted PDF Structure**: 1 paper (`1808.03720v3`) failed entirely with `Inconsistent number of pages: 5!=-1`, indicating the raw arxiv PDF byte structure was non-standard or corrupted.

**Conclusion for Ingestion**: While Docling is highly praised for clean business documents, applying it naively to dense scientific literature reveals severe memory constraints. Production ingestion of these files would require pre-filtering the PDFs (e.g., stripping vector graphics before parsing) or aggressively lowering the rasterization DPI.

### 2. Extraction Testing (LLM & Pydantic)
*(To be populated after implementing `extractor.py`)*

### 3. Pipeline Edge Cases & Error Handling
*(To be populated after implementing `pipeline.py`)*
