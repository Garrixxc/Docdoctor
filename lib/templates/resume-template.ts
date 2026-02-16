// Resume → Candidate Dataset template configuration

import { TemplateConfig } from './coi-template';

export const RESUME_TEMPLATE: TemplateConfig = {
    name: 'Resume → Candidate Dataset',
    slug: 'resume',
    version: '1.0',
    category: 'hr',
    fields: [
        {
            name: 'candidate_name',
            type: 'string',
            description: 'Full name of the candidate',
            required: true,
        },
        {
            name: 'email',
            type: 'string',
            description: 'Email address of the candidate',
            required: true,
        },
        {
            name: 'phone',
            type: 'string',
            description: 'Phone number of the candidate',
            required: false,
        },
        {
            name: 'location',
            type: 'string',
            description: 'Location/city of the candidate',
            required: false,
        },
        {
            name: 'skills',
            type: 'string', // stored as JSON array
            description: 'Array of skills mentioned in the resume',
            required: true,
        },
        {
            name: 'latest_company',
            type: 'string',
            description: 'Most recent employer/company',
            required: true,
        },
        {
            name: 'latest_title',
            type: 'string',
            description: 'Most recent job title/position',
            required: true,
        },
    ],
    validators: [
        {
            field: 'candidate_name',
            rule: 'required',
            message: 'Candidate name is required and must not be empty',
        },
        {
            field: 'email',
            rule: 'required',
            message: 'Email address is required',
        },
        {
            field: 'email',
            rule: 'email_format',
            message: 'Email address must be in a valid format (e.g., user@example.com)',
        },
    ],
    extractionPrompt: `Extract the following information from this resume/CV document:

Fields to extract:
1. candidate_name: Full name of the candidate
2. email: Email address
3. phone: Phone number (if available)
4. location: City/location (if available)
5. skills: List of technical and professional skills mentioned
6. latest_company: Most recent employer/company name
7. latest_title: Most recent job title/role

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

For skills, the value should be a JSON array of strings:
["Python", "JavaScript", "Project Management", ...]

Document text:
{{DOCUMENT_TEXT}}`,
};

// Detection keywords for Resume / CV documents
export const RESUME_DETECTION_KEYWORDS = {
    high: [
        'CURRICULUM VITAE',
        'RESUME',
        'PROFESSIONAL EXPERIENCE',
        'WORK EXPERIENCE',
        'EMPLOYMENT HISTORY',
    ],
    medium: [
        'EDUCATION',
        'SKILLS',
        'EXPERIENCE',
        'CERTIFICATIONS',
        'PROJECTS',
        'OBJECTIVE',
        'SUMMARY',
        'REFERENCES',
        'ACHIEVEMENTS',
    ],
    low: [
        'UNIVERSITY',
        'DEGREE',
        'BACHELOR',
        'MASTER',
        'GPA',
        'INTERNSHIP',
    ],
};
