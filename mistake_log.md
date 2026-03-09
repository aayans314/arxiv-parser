# Mistake Log

1. **Bug**: `UnicodeEncodeError` in `ingester.py` on Windows.
   *   **Cause**: The Windows console (`cp1252` encoding) failed to print filenames containing special characters (like Greek letters) downloaded from arXiv.
   *   **Fix**: Modified print statements to safely encode filenames to ASCII, ignoring unprintable characters: `print(f"[{idx}] {filename.encode('ascii', 'ignore').decode('ascii')}")`.
   *   **Lesson**: Always sanitize or safely encode strings when printing to stdout on diverse OS environments, especially when dealing with web-scraped data.

2. **System Limit**: `std::bad_alloc` in Docling.
   *   **Cause**: Extracting arXiv PDF `2208.04933` (a Higgs Boson paper) caused the underlying C++ rasterizer in Docling to run out of memory (OOM) due to extremely dense vector plots on page 4.
   *   **Fix**: Validated that the system correctly catches the exception and logs the failure gracefully to `failure_report.json` instead of bringing down the entire pipeline invisibly. Added as a demonstrated limitation of local OCR on minimal hardware.
   *   **Lesson**: Memory limits are a hard mathematical bound for embedded vector graphics. Always catch base exceptions in the ingestion layer.

3. **Bug**: `ReferenceError: useState is not defined` in `App.tsx`.
   *   **Cause**: When using `multi_replace_file_content` to add `react-katex` imports to the top of the file, the target content matched too broadly and accidentally removed the very first line: `import React, { useState, useEffect } from 'react';`.
   *   **Fix**: Pre-pended the imports back to the top of the file.
   *   **Lesson**: When editing the top of files using automated replace tools, specifically ensure the target block does not inadvertently swallow adjacent import statements.
