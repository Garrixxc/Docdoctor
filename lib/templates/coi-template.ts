// COI (Certificate of Insurance) template configuration

import { ValidationRule } from '../processing/validator';

export interface TemplateField {
    name: string;
    type: 'string' | 'number' | 'date' | 'boolean';
    description: string;
    required: boolean;
}

export interface TemplateConfig {
    name: string;
    slug: string;
    version: string;
    category: string;
    fields: TemplateField[];
    validators: ValidationRule[];
    extractionPrompt: string;
}

export const COI_TEMPLATE: TemplateConfig = {
    name: 'Vendor Compliance / Certificate of Insurance',
    slug: 'coi',
    version: '1.0',
    category: 'compliance',
    fields: [
        {
            name: 'vendor_name',
            type: 'string',
            description: 'Name of the vendor/organization',
            required: true,
        },
        {
            name: 'insured_name',
            type: 'string',
            description: 'Name of the insured party',
            required: true,
        },
        {
            name: 'policy_number',
            type: 'string',
            description: 'Insurance policy number',
            required: true,
        },
        {
            name: 'effective_date',
            type: 'date',
            description: 'Policy effective date',
            required: true,
        },
        {
            name: 'expiration_date',
            type: 'date',
            description: 'Policy expiration date',
            required: true,
        },
        {
            name: 'general_liability_each_occurrence',
            type: 'number',
            description: 'General liability coverage per occurrence',
            required: true,
        },
        {
            name: 'general_liability_aggregate',
            type: 'number',
            description: 'General liability aggregate coverage',
            required: true,
        },
        {
            name: 'additional_insured_present',
            type: 'boolean',
            description: 'Whether additional insured is present',
            required: false,
        },
        {
            name: 'waiver_of_subrogation_present',
            type: 'boolean',
            description: 'Whether waiver of subrogation is present',
            required: false,
        },
    ],
    validators: [
        {
            field: 'policy_number',
            rule: 'required',
            message: 'Policy number is required',
        },
        {
            field: 'expiration_date',
            rule: 'date_after_today',
            message: 'Policy expiration date must be in the future',
        },
        {
            field: 'general_liability_each_occurrence',
            rule: 'min_threshold',
            message: 'General liability per occurrence does not meet minimum requirement',
        },
        {
            field: 'general_liability_aggregate',
            rule: 'min_threshold',
            message: 'General liability aggregate does not meet minimum requirement',
        },
    ],
    extractionPrompt: `Extract the following information from this Certificate of Insurance document:

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
      "name": "field_name",
      "value": extracted_value,
      "confidence": 0.95,
      "evidence": {
        "text": "exact text from document",
        "page": 1,
        "charStart": 100,
        "charEnd": 150
      }
    },
    ...
  ]
}

Document text:
{{DOCUMENT_TEXT}}`,
};
