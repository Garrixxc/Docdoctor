// Cost guardrail — checks if accumulated run cost exceeds limit

import logger from './logger';

export interface CostGuardrailResult {
    allowed: boolean;
    currentCost: number;
    maxCost: number | null;
    message?: string;
}

/**
 * Check if a run should continue processing based on accumulated cost.
 * @param currentCost - total cost spent so far in this run
 * @param maxCostPerRun - the configured limit (null = no limit)
 * @returns whether processing should continue
 */
export function checkCostGuardrail(
    currentCost: number,
    maxCostPerRun: number | null
): CostGuardrailResult {
    if (maxCostPerRun === null || maxCostPerRun === undefined) {
        return {
            allowed: true,
            currentCost,
            maxCost: null,
        };
    }

    if (currentCost >= maxCostPerRun) {
        const message = `Cost guardrail triggered: $${currentCost.toFixed(4)} spent, limit is $${maxCostPerRun.toFixed(2)}. Remaining documents will be skipped.`;
        logger.warn({ currentCost, maxCostPerRun }, message);
        return {
            allowed: false,
            currentCost,
            maxCost: maxCostPerRun,
            message,
        };
    }

    return {
        allowed: true,
        currentCost,
        maxCost: maxCostPerRun,
    };
}
