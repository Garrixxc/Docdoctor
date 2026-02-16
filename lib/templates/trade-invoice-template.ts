// Trade Invoice / Commercial Invoice template configuration

import { TemplateConfig } from './coi-template';

export const TRADE_INVOICE_TEMPLATE: TemplateConfig = {
    name: 'Trade Docs – Commercial Invoice',
    slug: 'trade-invoice',
    version: '1.0',
    category: 'trade',
    fields: [
        {
            name: 'shipper',
            type: 'string',
            description: 'Name and address of the shipper/exporter',
            required: true,
        },
        {
            name: 'consignee',
            type: 'string',
            description: 'Name and address of the consignee/importer',
            required: true,
        },
        {
            name: 'invoice_number',
            type: 'string',
            description: 'Commercial invoice number',
            required: true,
        },
        {
            name: 'invoice_date',
            type: 'date',
            description: 'Date of the invoice (YYYY-MM-DD)',
            required: true,
        },
        {
            name: 'total_value',
            type: 'number',
            description: 'Total invoice value',
            required: true,
        },
        {
            name: 'currency',
            type: 'string',
            description: 'Currency code (e.g., USD, EUR, GBP)',
            required: true,
        },
        {
            name: 'incoterms',
            type: 'string',
            description: 'Incoterms (e.g., FOB, CIF, EXW)',
            required: false,
        },
        {
            name: 'line_items',
            type: 'string', // stored as JSON array
            description: 'Array of line items with description, qty, unit_price, total',
            required: true,
        },
    ],
    validators: [
        {
            field: 'invoice_number',
            rule: 'required',
            message: 'Invoice number is required',
        },
        {
            field: 'shipper',
            rule: 'required',
            message: 'Shipper name is required',
        },
        {
            field: 'consignee',
            rule: 'required',
            message: 'Consignee name is required',
        },
        {
            field: 'total_value',
            rule: 'required',
            message: 'Total value is required',
        },
        {
            field: 'total_value',
            rule: 'line_items_sum_check',
            message: 'Total value should approximately equal the sum of line item totals',
        },
    ],
    extractionPrompt: `Extract the following information from this Commercial Invoice document:

Fields to extract:
1. shipper: Name and address of the shipper/exporter
2. consignee: Name and address of the consignee/importer
3. invoice_number: Commercial invoice number
4. invoice_date: Date of the invoice (format: YYYY-MM-DD)
5. total_value: Total invoice value (number only, no currency symbol)
6. currency: Currency code (e.g., USD, EUR, GBP)
7. incoterms: Incoterms if present (e.g., FOB, CIF, EXW)
8. line_items: Array of line items, each with: description, qty, unit_price, total

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

For line_items, the value should be a JSON array:
[
  {"description": "Item description", "qty": 10, "unit_price": 5.00, "total": 50.00},
  ...
]

Document text:
{{DOCUMENT_TEXT}}`,
};

// Detection keywords for Trade Invoice documents
export const TRADE_INVOICE_DETECTION_KEYWORDS = {
    high: [
        'COMMERCIAL INVOICE',
        'PROFORMA INVOICE',
        'INVOICE NO',
        'INVOICE NUMBER',
        'BILL OF LADING',
        'PACKING LIST',
        'COUNTRY OF ORIGIN',
    ],
    medium: [
        'SHIP TO',
        'BILL TO',
        'SHIPPER',
        'CONSIGNEE',
        'INCOTERMS',
        'FOB',
        'CIF',
        'HARMONIZED CODE',
        'HS CODE',
        'NET WEIGHT',
        'GROSS WEIGHT',
    ],
    low: [
        'TOTAL',
        'QUANTITY',
        'UNIT PRICE',
        'AMOUNT',
        'DESCRIPTION OF GOODS',
    ],
};
