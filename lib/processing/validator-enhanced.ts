// Enhanced validation engine with FieldStatus support
// Implements trust logic: null/N/A → MISSING, proper confidence thresholds

import logger from '@/lib/utils/logger';
import { FieldStatus } from '@prisma/client';

export interface ValidationRule {
    field: string;
    rule: string;
    params?: any;
    message: string;
    required?: boolean;
}

export interface ValidationError {
    rule: string;
    message: string;
    severity: 'error' | 'warning';
}

export interface EnhancedValidationResult {
    field: string;
    fieldStatus: FieldStatus;
    confidence: number;
    validationErrors: ValidationError[];
    legacyStatus: 'PASS' | 'FAIL' | 'WARNING'; // For backwards compatibility
}

/**
 * Check if a value is null, empty, or "N/A"
 */
function isNullOrEmpty(value: any): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') {
        const trimmed = value.trim().toUpperCase();
        return trimmed === '' || trimmed === 'N/A' || trimmed === 'NULL' || trimmed === 'NONE';
    }
    return false;
}

/**
 * Enhanced validation with FieldStatus logic
 */
export function validateFieldEnhanced(
    fieldName: string,
    extractedValue: any,
    confidence: number,
    rules: ValidationRule[],
    projectRequirements?: Record<string, any>
): EnhancedValidationResult {
    const validationErrors: ValidationError[] = [];
    const REVIEW_THRESHOLD = 0.85; // Confidence threshold for auto-approval

    // Rule 1: Check if value is missing/null/N/A
    if (isNullOrEmpty(extractedValue)) {
        const isRequired = rules.some(r => r.field === fieldName && r.rule === 'required');

        return {
            field: fieldName,
            fieldStatus: 'MISSING',
            confidence: Math.min(confidence, 0.30), // Cap confidence at 30% for missing values
            validationErrors: isRequired ? [{
                rule: 'required',
                message: `${fieldName} is required but was not found in the document`,
                severity: 'error',
            }] : [],
            legacyStatus: isRequired ? 'FAIL' : 'WARNING',
        };
    }

    // Rule 2: Check confidence threshold
    if (confidence < REVIEW_THRESHOLD) {
        validationErrors.push({
            rule: 'low_confidence',
            message: `Confidence (${(confidence * 100).toFixed(1)}%) below review threshold (${REVIEW_THRESHOLD * 100}%)`,
            severity: 'warning',
        });
    }

    // Rule 3: Run field-specific validators
    for (const rule of rules.filter(r => r.field === fieldName)) {
        try {
            switch (rule.rule) {
                case 'required':
                    // Already handled above
                    break;

                case 'date_after_today':
                    if (extractedValue) {
                        const date = new Date(extractedValue);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        if (isNaN(date.getTime())) {
                            validationErrors.push({
                                rule: 'date_after_today',
                                message: `${fieldName} is not a valid date: "${extractedValue}"`,
                                severity: 'error',
                            });
                        } else if (date < today) {
                            validationErrors.push({
                                rule: 'date_after_today',
                                message: rule.message || `${fieldName} must be after today (got ${date.toLocaleDateString()})`,
                                severity: 'error',
                            });
                        }
                    }
                    break;

                case 'min_value':
                    if (extractedValue !== null && extractedValue !== undefined) {
                        const numValue = Number(extractedValue);
                        const minValue = rule.params?.value || 0;
                        if (isNaN(numValue)) {
                            validationErrors.push({
                                rule: 'min_value',
                                message: `${fieldName} is not a valid number: "${extractedValue}"`,
                                severity: 'error',
                            });
                        } else if (numValue < minValue) {
                            validationErrors.push({
                                rule: 'min_value',
                                message: rule.message || `${fieldName} must be at least ${minValue} (got ${numValue})`,
                                severity: 'error',
                            });
                        }
                    }
                    break;

                case 'min_threshold':
                    // Check against project requirements
                    if (projectRequirements) {
                        const numValue = Number(extractedValue);
                        const threshold = projectRequirements[fieldName];
                        if (threshold) {
                            if (isNaN(numValue)) {
                                validationErrors.push({
                                    rule: 'min_threshold',
                                    message: `${fieldName} is not a valid number: "${extractedValue}"`,
                                    severity: 'error',
                                });
                            } else if (numValue < threshold) {
                                validationErrors.push({
                                    rule: 'min_threshold',
                                    message: rule.message || `${fieldName} (${numValue}) does not meet minimum requirement (${threshold})`,
                                    severity: 'error',
                                });
                            }
                        }
                    }
                    break;

                case 'boolean_required':
                    // For toggles like "require_additional_insured"
                    if (projectRequirements) {
                        const required = projectRequirements[`require_${fieldName}`];
                        if (required && extractedValue !== true) {
                            validationErrors.push({
                                rule: 'boolean_required',
                                message: rule.message || `${fieldName} is required to be true`,
                                severity: 'error',
                            });
                        }
                    }
                    break;

                default:
                    logger.warn({ rule: rule.rule }, 'Unknown validation rule');
            }
        } catch (error: any) {
            logger.error({ field: fieldName, error: error.message }, 'Validation error');
            validationErrors.push({
                rule: rule.rule,
                message: `Validation error: ${error.message}`,
                severity: 'warning',
            });
        }
    }

    // Determine FieldStatus
    let fieldStatus: FieldStatus;
    let legacyStatus: 'PASS' | 'FAIL' | 'WARNING';

    const hasErrors = validationErrors.some(e => e.severity === 'error');
    const hasWarnings = validationErrors.some(e => e.severity === 'warning');

    if (hasErrors) {
        fieldStatus = 'FAIL_VALIDATION';
        legacyStatus = 'FAIL';
    } else if (hasWarnings || confidence < REVIEW_THRESHOLD) {
        fieldStatus = 'NEEDS_REVIEW';
        legacyStatus = 'WARNING';
    } else {
        fieldStatus = 'PASS';
        legacyStatus = 'PASS';
    }

    return {
        field: fieldName,
        fieldStatus,
        confidence,
        validationErrors,
        legacyStatus,
    };
}

/**
 * Validate all extracted fields
 */
export function validateExtraction(
    data: Record<string, any>,
    confidences: Record<string, number>,
    rules: ValidationRule[],
    projectRequirements?: Record<string, any>
): EnhancedValidationResult[] {
    const results: EnhancedValidationResult[] = [];

    // Get all field names from both data and rules
    const allFields = new Set([
        ...Object.keys(data),
        ...rules.map(r => r.field),
    ]);

    for (const fieldName of allFields) {
        const value = data[fieldName];
        const confidence = confidences[fieldName] || 0;

        const result = validateFieldEnhanced(
            fieldName,
            value,
            confidence,
            rules,
            projectRequirements
        );

        results.push(result);
    }

    return results;
}
