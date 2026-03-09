import os
from pathlib import Path
from docling.document_converter import DocumentConverter

def ingest_pdfs(input_dir="data/raw", output_dir="data/processed"):
    """
    Reads PDFs from input_dir and converts them to Markdowns using docling.
    Saves outputs in output_dir.
    """
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    # Initialize the Docling converter
    converter = DocumentConverter()
    
    input_path = Path(input_dir)
    pdf_files = list(input_path.glob("*.pdf"))
    
    if not pdf_files:
        print(f"No PDFs found in {input_dir}")
        return

    print(f"Found {len(pdf_files)} PDFs in {input_dir}. Starting ingestion...")

    results = []
    for idx, pdf_file in enumerate(pdf_files):
        safe_print_name = pdf_file.name.encode('ascii', 'ignore').decode('ascii')
        print(f"[{idx+1}/{len(pdf_files)}] Processing: {safe_print_name}")
        try:
            # Convert the PDF to a Docling Document Model
            doc = converter.convert(pdf_file)
            
            # Export to Markdown format
            markdown_content = doc.document.export_to_markdown()
            
            # Save the Markdown output
            output_filename = pdf_file.stem + ".md"
            output_path = os.path.join(output_dir, output_filename)
            
            with open(output_path, "w", encoding="utf-8") as f:
                f.write(markdown_content)
                
            print(f"  Successfully saved markdown")
            
            results.append({
                "source_pdf": str(pdf_file),
                "markdown_path": output_path,
                "status": "success"
            })
            
        except Exception as e:
            print(f"  Failed to process {safe_print_name}: {str(e).encode('ascii', 'ignore').decode('ascii')}")
            results.append({
                "source_pdf": str(pdf_file),
                "error": str(e),
                "status": "failed"
            })
            
    return results

if __name__ == "__main__":
    results = ingest_pdfs()
    success = sum(1 for r in results if r["status"] == "success")
    print(f"\nIngestion Complete: {success} succeeded, {len(results)-success} failed.")
