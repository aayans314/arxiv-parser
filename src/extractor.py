import os
import json
from pydantic import BaseModel, Field
from typing import List, Optional
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

class TableData(BaseModel):
    table_index: int = Field(description="The index/number of the table in the document.")
    caption: str = Field(description="The caption describing the table.")
    headers: List[str] = Field(description="The column headers of the table.")
    rows: List[List[str]] = Field(description="The rows of data in the table.")

class PhysicsMathEquation(BaseModel):
    equation_latex: str = Field(description="The latex representation of the math equation.")
    context: str = Field(description="What the equation represents based on surrounding text.")

class PhysicsExperimentResult(BaseModel):
    paper_title: str = Field(description="Title of the paper")
    experiment_type: str = Field(description="The type of physics experiment conducted (e.g., ATLAS collision).")
    key_findings: List[str] = Field(description="The main results or findings reported in the paper.")
    error_margins: Optional[str] = Field(description="Any reported systematic or statistical error margins.")
    tables: List[TableData] = Field(description="Extracted data tables relevant to the experiment.")
    key_equations: List[PhysicsMathEquation] = Field(description="Key mathematical formulas critical to the result.")
    confidence_score: float = Field(description="A confidence score between 0.0 and 1.0 indicating how well the data could be extracted from the unstructured text.")
    failure_reasons: List[str] = Field(description="If confidence is low (< 0.8), list the reasons why. E.g., 'Table was garbled', 'Could not locate error bounds'.")

def extract_structured_data(markdown_content: str, model="deepseek-chat") -> PhysicsExperimentResult:
    """
    Uses OpenAI Structured Outputs to force the LLM to return data matching the PhysicsExperimentResult schema.
    """
    client = OpenAI(
        base_url="https://api.deepseek.com",
        api_key="sk-4a598910f0334b1f9e4113b5405c74f7",
    )
    
    # We pass the entire markdown document to the LLM as requested for the optoelectronic neural network research
    prompt = f"""
    You are an expert AI data engineer processing unstructured scientific documents.
    Your task is to extract structured information from the following LaTeX/Markdown representation of a high energy physics paper.
    Pay special attention to tables and mathematical equations.
    If you cannot find specific fields (like error margins), leave them null and lower the confidence_score.
    If tables appear garbled or unreadable, note this in failure_reasons.
    
    You must output a raw JSON object exactly matching this schema:
    {PhysicsExperimentResult.model_json_schema()}
    
    Document Content:
    {markdown_content}
    """

    print("  Sending to Deepseek for JSON extraction...")
    
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": "You are a highly precise scientific data extraction system. You only output pure JSON."},
            {"role": "user", "content": prompt}
        ],
        response_format={"type": "json_object"},
        temperature=0.1
    )

    raw_json = response.choices[0].message.content
    extracted_data = PhysicsExperimentResult(**json.loads(raw_json))
    return extracted_data

def process_all_markdowns(input_dir="data/processed", output_dir="data/output"):
    """
    Iterates over all generated markdown files, extracts data, and logs failures.
    """
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    results = []
    failures = []
    
    for filename in os.listdir(input_dir):
        if not filename.endswith(".md"):
            continue
            
        filepath = os.path.join(input_dir, filename)
        print(f"Extracting from: {filename}")
        
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
            
        try:
            structured_data = extract_structured_data(content)
            
            # Convert pydantic model to dict
            data_dict = structured_data.model_dump()
            data_dict["source_file"] = filename
            
            results.append(data_dict)
            
            # Log failure if confidence is low
            if structured_data.confidence_score < 0.8 or len(structured_data.failure_reasons) > 0:
                print(f"  Warning: Low confidence ({structured_data.confidence_score}). Logging failure.")
                failures.append({
                    "source_file": filename,
                    "confidence_score": structured_data.confidence_score,
                    "reasons": structured_data.failure_reasons
                })
            else:
                print(f"  Success: High confidence ({structured_data.confidence_score}).")
                
        except Exception as e:
            print(f"  Critical pipeline failure on {filename}: {e}")
            failures.append({
                "source_file": filename,
                "confidence_score": 0.0,
                "reasons": [str(e)]
            })
            
    # Save the output
    results_path = os.path.join(output_dir, "results.json")
    failures_path = os.path.join(output_dir, "failure_report.json")
    
    with open(results_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
        
    with open(failures_path, "w", encoding="utf-8") as f:
        json.dump(failures, f, indent=2)
        
    print(f"\nExtraction complete. Results saved to {output_dir}")
    print(f"Total processed: {len(results)}. Failures logged: {len(failures)}")

if __name__ == "__main__":
    # Note: Requires OPENAI_API_KEY in .env file or environment
    process_all_markdowns()
