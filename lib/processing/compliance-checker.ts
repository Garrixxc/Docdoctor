// Compliance checker - computes RecordStatus from field statuses
// Implements business logic for COI compliance

import { RecordStatus, FieldStatus } from '@prisma/client';
import logger from '@/lib/utils/logger';

export interface FieldStatusInfo {
    fieldName: string;
    fieldStatus: FieldStatus;
    isRequired: boolean;
}

export interface ComplianceResult {
    recordStatus: RecordStatus;
    failedRules: string[];
    summary: string;
}

/**
 * Compute record compliance status from field statuses
 */
export function computeRecordStatus(
    fields: FieldStatusInfo[]
): ComplianceResult {
    const failedRules: string[] = [];

    // Check for required fields that are missing
    const missingRequired = fields.filter(
        f => f.isRequired && f.fieldStatus === 'MISSING'
    );
    if (missingRequired.length > 0) {
        failedRules.push(
            `Missing required fields: ${missingRequired.map(f => f.fieldName).join(', ')}`
        );
    }

    // Check for validation failures
    const failedValidation = fields.filter(
        f => f.fieldStatus === 'FAIL_VALIDATION'
    );
    if (failedValidation.length > 0) {
        failedRules.push(
            `Failed validation: ${failedValidation.map(f => f.fieldName).join(', ')}`
        );
    }

    // Check for fields needing review
    const needsReview = fields.filter(
        f => f.fieldStatus === 'NEEDS_REVIEW'
    );

    // Check if document was skipped
    const wasSkipped = fields.some(
        f => f.fieldStatus === 'SKIPPED_WRONG_DOC_TYPE'
    );

    // Determine record status
    let recordStatus: RecordStatus;
    let summary: string;

    if (wasSkipped) {
        recordStatus = 'SKIPPED';
        summary = 'Document was skipped due to wrong document type';
    } else if (failedRules.length > 0) {
        recordStatus = 'NON_COMPLIANT';
        summary = `Document is non-compliant: ${failedRules.join('; ')}`;
    } else if (needsReview.length > 0) {
        recordStatus = 'NEEDS_REVIEW';
        summary = `${needsReview.length} field(s) need manual review`;
    } else {
        recordStatus = 'COMPLIANT';
        summary = 'All required fields extracted and validated successfully';
    }

    logger.info({
        recordStatus,
        failedRulesCount: failedRules.length,
        needsReviewCount: needsReview.length,
    }, 'Compliance check completed');

    return {
        recordStatus,
        failedRules,
        summary,
    };
}

/**
 * Check specific COI compliance rules
 */
export function checkCOICompliance(
    extractedData: Record<string, any>,
    projectRequirements: Record<string, any>
): string[] {
    const violations: string[] = [];

    // Check expiration date
    if (projectRequirements.expiration_must_be_future !== false) {
        const expirationDate = extractedData.expiration_date;
        if (expirationDate) {
            const date = new Date(expirationDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (date < today) {
                violations.push('Certificate has expired');
            }
        }
    }

    // Check general liability limits
    if (projectRequirements.min_gl_each_occurrence) {
        const limit = Number(extractedData.general_liability_each_occurrence);
        if (limit < projectRequirements.min_gl_each_occurrence) {
            violations.push(
                `General Liability Each Occurrence (${limit}) below minimum (${projectRequirements.min_gl_each_occurrence})`
            );
        }
    }

    if (projectRequirements.min_gl_aggregate) {
        const limit = Number(extractedData.general_liability_aggregate);
        if (limit < projectRequirements.min_gl_aggregate) {
            violations.push(
                `General Liability Aggregate (${limit}) below minimum (${projectRequirements.min_gl_aggregate})`
            );
        }
    }

    // Check additional insured
    if (projectRequirements.require_additional_insured) {
        const hasAdditionalInsured = extractedData.additional_insured_present === true;
        if (!hasAdditionalInsured) {
            violations.push('Additional Insured is required but not present');
        }
    }

    // Check waiver of subrogation
    if (projectRequirements.require_waiver_of_subrogation) {
        const hasWaiver = extractedData.waiver_of_subrogation_present === true;
        if (!hasWaiver) {
            violations.push('Waiver of Subrogation is required but not present');
        }
    }

    return violations;
}
