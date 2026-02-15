// Document type classifier for Certificate of Insurance (COI) documents
// Uses keyword-based heuristic scoring

import logger from '@/lib/utils/logger';

export interface ClassificationResult {
    score: number; // 0-1, confidence that document matches expected type
    detectedType: string; // e.g., 'COI', 'UNKNOWN'
    reason: string; // Human-readable explanation
    keywords: string[]; // Keywords found in document
}

// COI-specific keywords with weights
const COI_KEYWORDS = {
    // High-weight keywords (strong indicators)
    high: [
        'CERTIFICATE OF LIABILITY INSURANCE',
        'ACORD',
        'CERTIFICATE HOLDER',
        'PRODUCER',
        'INSURED',
        'POLICY NUMBER',
        'EFFECTIVE DATE',
        'EXPIRATION DATE',
        'GENERAL LIABILITY',
        'COMMERCIAL GENERAL LIABILITY',
        'AUTOMOBILE LIABILITY',
        'WORKERS COMPENSATION',
        'UMBRELLA LIAB',
    ],
    // Medium-weight keywords (moderate indicators)
    medium: [
        'INSURANCE',
        'COVERAGE',
        'LIMITS',
        'DEDUCTIBLE',
        'PREMIUM',
        'ENDORSEMENT',
        'AGGREGATE',
        'OCCURRENCE',
        'CLAIMS-MADE',
    ],
    // Low-weight keywords (weak indicators, common in insurance docs)
    low: [
        'LIABILITY',
        'POLICY',
        'INSURER',
        'AGENT',
        'BROKER',
    ],
};

const WEIGHTS = {
    high: 0.15,
    medium: 0.05,
    low: 0.02,
};

/**
 * Classify if a document is a Certificate of Insurance
 */
export function classifyCOI(documentText: string): ClassificationResult {
    const upperText = documentText.toUpperCase();
    const foundKeywords: string[] = [];
    let score = 0;

    // Check high-weight keywords
    for (const keyword of COI_KEYWORDS.high) {
        if (upperText.includes(keyword)) {
            foundKeywords.push(keyword);
            score += WEIGHTS.high;
        }
    }

    // Check medium-weight keywords
    for (const keyword of COI_KEYWORDS.medium) {
        if (upperText.includes(keyword)) {
            foundKeywords.push(keyword);
            score += WEIGHTS.medium;
        }
    }

    // Check low-weight keywords
    for (const keyword of COI_KEYWORDS.low) {
        if (upperText.includes(keyword)) {
            foundKeywords.push(keyword);
            score += WEIGHTS.low;
        }
    }

    // Cap score at 1.0
    score = Math.min(score, 1.0);

    // Determine detected type and reason
    let detectedType = 'UNKNOWN';
    let reason = '';

    if (score >= 0.3) {
        detectedType = 'COI';
        reason = `Document appears to be a Certificate of Insurance (score: ${(score * 100).toFixed(1)}%). Found ${foundKeywords.length} relevant keywords.`;
    } else if (score >= 0.1) {
        detectedType = 'INSURANCE_RELATED';
        reason = `Document may be insurance-related but not a COI (score: ${(score * 100).toFixed(1)}%). Consider manual review.`;
    } else {
        detectedType = 'NON_COI';
        reason = `Document does not appear to be a Certificate of Insurance (score: ${(score * 100).toFixed(1)}%). Found only ${foundKeywords.length} relevant keywords.`;
    }

    logger.info({
        score,
        detectedType,
        keywordCount: foundKeywords.length,
    }, 'Document classification completed');

    return {
        score,
        detectedType,
        reason,
        keywords: foundKeywords,
    };
}

/**
 * Generic classifier factory - can be extended for other document types
 */
export class DocumentClassifier {
    constructor(private templateType: string) { }

    classify(documentText: string): ClassificationResult {
        // For now, only support COI
        if (this.templateType === 'coi' || this.templateType === 'vendor-compliance') {
            return classifyCOI(documentText);
        }

        // Default: accept all documents
        return {
            score: 1.0,
            detectedType: 'GENERIC',
            reason: 'No specific classification rules for this template type',
            keywords: [],
        };
    }
}
