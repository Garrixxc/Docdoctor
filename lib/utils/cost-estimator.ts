// Token counting and cost estimation utilities

interface ModelPricing {
    inputPer1k: number;
    outputPer1k: number;
}

const MODEL_PRICING: Record<string, ModelPricing> = {
    'gpt-4o': {
        inputPer1k: 0.0025,
        outputPer1k: 0.01,
    },
    'gpt-4o-mini': {
        inputPer1k: 0.00015,
        outputPer1k: 0.0006,
    },
    'gpt-4-turbo': {
        inputPer1k: 0.01,
        outputPer1k: 0.03,
    },
    'gpt-3.5-turbo': {
        inputPer1k: 0.0005,
        outputPer1k: 0.0015,
    },
};

/**
 * Rough token estimation (4 chars ≈ 1 token)
 */
export function estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
}

/**
 * Estimate cost for a completion
 */
export function estimateCost(params: {
    model: string;
    inputTokens: number;
    outputTokens: number;
}): number {
    const { model, inputTokens, outputTokens } = params;
    const pricing = MODEL_PRICING[model] || MODEL_PRICING['gpt-4o-mini'];

    const inputCost = (inputTokens / 1000) * pricing.inputPer1k;
    const outputCost = (outputTokens / 1000) * pricing.outputPer1k;

    return inputCost + outputCost;
}

/**
 * Get model pricing info
 */
export function getModelPricing(model: string): ModelPricing {
    return MODEL_PRICING[model] || MODEL_PRICING['gpt-4o-mini'];
}
