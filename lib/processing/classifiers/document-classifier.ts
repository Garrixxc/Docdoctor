// Document type classifier — uses template-driven keyword scoring
// Supports any template with detectionKeywords config

import logger from '@/lib/utils/logger';

export interface ClassificationResult {
    score: number; // 0-1, confidence that document matches expected type
    detectedType: string; // e.g., 'COI', 'TRADE_INVOICE', 'RESUME', 'UNKNOWN'
    reason: string; // Human-readable explanation
    keywords: string[]; // Keywords found in document
}

interface DetectionKeywords {
    high: string[];
    medium: string[];
    low: string[];
}

const WEIGHTS = {
    high: 0.15,
    medium: 0.05,
    low: 0.02,
};

// Fallback detection keywords by template slug (used when templateConfig doesn't include them)
const FALLBACK_KEYWORDS: Record<string, DetectionKeywords> = {
    coi: {
        high: [
            'CERTIFICATE OF LIABILITY INSURANCE', 'ACORD', 'CERTIFICATE HOLDER',
            'PRODUCER', 'INSURED', 'POLICY NUMBER', 'EFFECTIVE DATE', 'EXPIRATION DATE',
            'GENERAL LIABILITY', 'COMMERCIAL GENERAL LIABILITY',
        ],
        medium: [
            'INSURANCE', 'COVERAGE', 'LIMITS', 'DEDUCTIBLE', 'AGGREGATE', 'OCCURRENCE',
        ],
        low: ['LIABILITY', 'POLICY', 'INSURER'],
    },
    'trade-invoice': {
        high: [
            'COMMERCIAL INVOICE', 'PROFORMA INVOICE', 'INVOICE NO',
            'INVOICE NUMBER', 'BILL OF LADING', 'COUNTRY OF ORIGIN',
        ],
        medium: [
            'SHIP TO', 'BILL TO', 'SHIPPER', 'CONSIGNEE', 'INCOTERMS',
            'FOB', 'CIF', 'HS CODE', 'NET WEIGHT', 'GROSS WEIGHT',
        ],
        low: ['TOTAL', 'QUANTITY', 'UNIT PRICE', 'AMOUNT'],
    },
    resume: {
        high: [
            'CURRICULUM VITAE', 'RESUME', 'PROFESSIONAL EXPERIENCE',
            'WORK EXPERIENCE', 'EMPLOYMENT HISTORY',
        ],
        medium: [
            'EDUCATION', 'SKILLS', 'EXPERIENCE', 'CERTIFICATIONS',
            'PROJECTS', 'OBJECTIVE', 'SUMMARY', 'REFERENCES',
        ],
        low: ['UNIVERSITY', 'DEGREE', 'BACHELOR', 'MASTER', 'GPA'],
    },
};

/**
 * Score document text against a set of detection keywords
 */
function scoreDocumentAgainstKeywords(
    documentText: string,
    keywords: DetectionKeywords
): { score: number; foundKeywords: string[] } {
    const upperText = documentText.toUpperCase();
    const foundKeywords: string[] = [];
    let score = 0;

    for (const keyword of keywords.high) {
        if (upperText.includes(keyword.toUpperCase())) {
            foundKeywords.push(keyword);
            score += WEIGHTS.high;
        }
    }

    for (const keyword of keywords.medium) {
        if (upperText.includes(keyword.toUpperCase())) {
            foundKeywords.push(keyword);
            score += WEIGHTS.medium;
        }
    }

    for (const keyword of keywords.low) {
        if (upperText.includes(keyword.toUpperCase())) {
            foundKeywords.push(keyword);
            score += WEIGHTS.low;
        }
    }

    return { score: Math.min(score, 1.0), foundKeywords };
}

/**
 * Classify document against a specific template's detection keywords.
 * Accepts detection keywords from the template config or falls back
 * to built-in keyword sets by slug.
 */
export function classifyDocument(
    documentText: string,
    templateSlug: string,
    templateDetectionKeywords?: DetectionKeywords
): ClassificationResult {
    const keywords = templateDetectionKeywords
        || FALLBACK_KEYWORDS[templateSlug]
        || null;

    // If no keywords configured, accept all documents
    if (!keywords) {
        return {
            score: 1.0,
            detectedType: 'GENERIC',
            reason: 'No detection keywords configured for this template — all documents accepted.',
            keywords: [],
        };
    }

    const { score, foundKeywords } = scoreDocumentAgainstKeywords(documentText, keywords);

    const typeLabel = templateSlug.toUpperCase().replace(/-/g, '_');
    let detectedType = 'UNKNOWN';
    let reason = '';

    if (score >= 0.3) {
        detectedType = typeLabel;
        reason = `Document matches ${templateSlug} template (score: ${(score * 100).toFixed(1)}%). Found ${foundKeywords.length} relevant keywords.`;
    } else if (score >= 0.1) {
        detectedType = `MAYBE_${typeLabel}`;
        reason = `Document may be related to ${templateSlug} but score is low (${(score * 100).toFixed(1)}%). Consider manual review.`;
    } else {
        detectedType = `NOT_${typeLabel}`;
        reason = `Document does not match ${templateSlug} template (score: ${(score * 100).toFixed(1)}%). Found only ${foundKeywords.length} relevant keywords.`;
    }

    logger.info({
        templateSlug,
        score,
        detectedType,
        keywordCount: foundKeywords.length,
    }, 'Document classification completed');

    return { score, detectedType, reason, keywords: foundKeywords };
}

// Legacy export for backward compatibility
export function classifyCOI(documentText: string): ClassificationResult {
    return classifyDocument(documentText, 'coi');
}

/**
 * Generic classifier factory — delegates to classifyDocument
 * with template-specific detection keywords.
 */
export class DocumentClassifier {
    private detectionKeywords?: DetectionKeywords;

    constructor(
        private templateSlug: string,
        detectionKeywords?: DetectionKeywords
    ) {
        this.detectionKeywords = detectionKeywords;
    }

    classify(documentText: string): ClassificationResult {
        return classifyDocument(documentText, this.templateSlug, this.detectionKeywords);
    }
}
