# Sample LLM Extraction Prompts

## COI (Certificate of Insurance) Template

### System Message

\`\`\`
You are a precise document data extraction assistant. Extract structured data according to the provided schema. For each field, provide:
1. The extracted value
2. A confidence score (0.0 to 1.0)
3. Evidence snippet from the document (exact text and location)

Return JSON only. No additional commentary.
\`\`\`

### User Message Template

\`\`\`
Extract the following information from this Certificate of Insurance document:

Fields to extract:
1. vendor_name: Name of the vendor/organization
2. insured_name: Name of the insured party
3. policy_number: Insurance policy number
4. effective_date: Policy effective date (format: YYYY-MM-DD)
5. expiration_date: Policy expiration date (format: YYYY-MM-DD)
6. general_liability_each_occurrence: General liability coverage per occurrence (number)
7. general_liability_aggregate: General liability aggregate coverage (number)
8. additional_insured_present: Whether additional insured is present (true/false)
9. waiver_of_subrogation_present: Whether waiver of subrogation is present (true/false)

For EACH field, provide:
- The extracted value
- A confidence score (0.0 to 1.0) indicating how certain you are
- Evidence: the exact text snippet from the document, page number, and approximate character position

Return your response in this JSON format:
{
  "fields": [
    {
      "name": "vendor_name",
      "value": "Acme Corporation",
      "confidence": 0.95,
      "evidence": {
        "text": "Acme Corporation",
        "page": 1,
        "charStart": 45,
        "charEnd": 61
      }
    },
    {
      "name": "policy_number",
      "value": "POL-2024-987654",
      "confidence": 0.92,
      "evidence": {
        "text": "Policy Number: POL-2024-987654",
        "page": 1,
        "charStart": 120,
        "charEnd": 150
      }
    },
    ...
  ]
}

Document text:
[FULL DOCUMENT TEXT WILL BE INSERTED HERE]
\`\`\`

### Example Response

\`\`\`json
{
  "fields": [
    {
      "name": "vendor_name",
      "value": "ABC Contracting LLC",
      "confidence": 0.98,
      "evidence": {
        "text": "Insured: ABC Contracting LLC",
        "page": 1,
        "charStart": 234,
        "charEnd": 262
      }
    },
    {
      "name": "policy_number",
      "value": "GL-2024-123456",
      "confidence": 0.95,
      "evidence": {
        "text": "Policy No. GL-2024-123456",
        "page": 1,
        "charStart": 450,
        "charEnd": 475
      }
    },
    {
      "name": "effective_date",
      "value": "2024-01-01",
      "confidence": 0.99,
      "evidence": {
        "text": "Effective Date: 01/01/2024",
        "page": 1,
        "charStart": 500,
        "charEnd": 526
      }
    },
    {
      "name": "expiration_date",
      "value": "2025-01-01",
      "confidence": 0.99,
      "evidence": {
        "text": "Expiration Date: 01/01/2025",
        "page": 1,
        "charStart": 530,
        "charEnd": 557
      }
    },
    {
      "name": "general_liability_each_occurrence",
      "value": 1000000,
      "confidence": 0.92,
      "evidence": {
        "text": "Each Occurrence: $1,000,000",
        "page": 1,
        "charStart": 800,
        "charEnd": 827
      }
    },
    {
      "name": "general_liability_aggregate",
      "value": 2000000,
      "confidence": 0.92,
      "evidence": {
        "text": "General Aggregate: $2,000,000",
        "page": 1,
        "charStart": 850,
        "charEnd": 879
      }
    },
    {
      "name": "additional_insured_present",
      "value": true,
      "confidence": 0.85,
      "evidence": {
        "text": "Additional Insured: Yes",
        "page": 2,
        "charStart": 100,
        "charEnd": 123
      }
    },
    {
      "name": "waiver_of_subrogation_present",
      "value": true,
      "confidence": 0.80,
      "evidence": {
        "text": "Waiver of Subrogation is included",
        "page": 2,
        "charStart": 200,
        "charEnd": 233
      }
    }
  ]
}
\`\`\`

### Notes

1. **Confidence Scoring**: Train the model to be conservative. Lower confidence if:
   - Text is ambiguous
   - Multiple possible interpretations
   - OCR quality is poor
   - Required field not found
   
2. **Evidence Quality**: Always include:
   - Exact text snippet (verbatim from document)
   - Page number
   - Approximate character offsets for traceability

3. **Date Normalization**: Always return dates in `YYYY-MM-DD` format regardless of input format.

4. **Number Extraction**: Strip currency symbols and commas, return raw numbers.

5. **Boolean Fields**: Return \`true\` or \`false\`, not strings. Use confidence to indicate uncertainty.
