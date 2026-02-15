// Validation engine for extracted data

import logger from '@/lib/utils/logger';

export interface ValidationRule {
    field: string;
    rule: string;
    params?: any;
    message: string;
}

export interface ValidationResult {
    field: string;
    status: 'PASS' | 'FAIL' | 'WARNING';
    messages: string[];
}

/**
 * Validate extracted data against template rules
 */
export function validateExtraction(
    data: Record<string, any>,
    rules: ValidationRule[],
    projectRequirements?: Record<string, any>
): ValidationResult[] {
    const results: ValidationResult[] = [];

    for (const rule of rules) {
        const value = data[rule.field];
        let status: 'PASS' | 'FAIL' | 'WARNING' = 'PASS';
        const messages: string[] = [];

        try {
            switch (rule.rule) {
                case 'required':
                    if (value === null || value === undefined || value === '') {
                        status = 'FAIL';
                        messages.push(rule.message || `${rule.field} is required`);
                    }
                    break;

                case 'date_after_today':
                    if (value) {
                        const date = new Date(value);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        if (date < today) {
                            status = 'FAIL';
                            messages.push(
                                rule.message || `${rule.field} must be after today`
                            );
                        }
                    }
                    break;

                case 'min_value':
                    if (value !== null && value !== undefined) {
                        const numValue = Number(value);
                        const minValue = rule.params?.value || 0;
                        if (numValue < minValue) {
                            status = 'FAIL';
                            messages.push(
                                rule.message ||
                                `${rule.field} must be at least ${minValue}, got ${numValue}`
                            );
                        }
                    }
                    break;

                case 'min_threshold':
                    // Check against project requirements
                    if (
                        value !== null &&
                        value !== undefined &&
                        projectRequirements
                    ) {
                        const numValue = Number(value);
                        const threshold = projectRequirements[rule.field];
                        if (threshold && numValue < threshold) {
                            status = 'FAIL';
                            messages.push(
                                rule.message ||
                                `${rule.field} (${numValue}) does not meet minimum threshold (${threshold})`
                            );
                        }
                    }
                    break;

                case 'boolean':
                    if (typeof value !== 'boolean') {
                        status = 'WARNING';
                        messages.push(
                            rule.message || `${rule.field} should be true or false`
                        );
                    }
                    break;

                default:
                    logger.warn({ rule: rule.rule }, 'Unknown validation rule');
            }
        } catch (error: any) {
            logger.error(
                { field: rule.field, error: error.message },
                'Validation error'
            );
            status = 'WARNING';
            messages.push(`Validation error: ${error.message}`);
        }

        results.push({
            field: rule.field,
            status,
            messages,
        });
    }

    return results;
}
