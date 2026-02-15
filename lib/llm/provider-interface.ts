// LLM Provider interface for swappable providers

export interface ExtractionParams {
    prompt: string;
    schema: Record<string, any>;
    model?: string;
    temperature?: number;
    maxTokens?: number;
}

export interface ExtractionResult {
    data: Record<string, any>;
    confidence: Record<string, number>;
    evidence: Record<string, EvidenceSnippet[]>;
    usage: {
        inputTokens: number;
        outputTokens: number;
        totalTokens: number;
    };
    cost: number;
}

export interface EvidenceSnippet {
    text: string;
    page?: number;
    charStart?: number;
    charEnd?: number;
}

export interface CostParams {
    model: string;
    inputTokens: number;
    estimatedOutputTokens: number;
}

export interface LLMProvider {
    extract(params: ExtractionParams): Promise<ExtractionResult>;
    estimateCost(params: CostParams): number;
    getName(): string;
}
