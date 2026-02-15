import OpenAI from 'openai';
import {
    LLMProvider,
    ExtractionParams,
    ExtractionResult,
    CostParams,
} from './provider-interface';
import { estimateCost as calculateCost } from '@/lib/utils/cost-estimator';
import logger from '@/lib/utils/logger';

export class OpenAIProvider implements LLMProvider {
    private client: OpenAI;
    private apiKey: string;

    constructor(apiKey?: string) {
        this.apiKey = apiKey || process.env.OPENAI_API_KEY || '';
        if (!this.apiKey) {
            throw new Error('OpenAI API key is required');
        }
        this.client = new OpenAI({ apiKey: this.apiKey });
    }

    getName(): string {
        return 'OpenAI';
    }

    async extract(params: ExtractionParams): Promise<ExtractionResult> {
        const {
            prompt,
            schema,
            model = 'gpt-4o-mini',
            temperature = 0.1,
            maxTokens = 4000,
        } = params;

        try {
            logger.info({ model, temperature }, 'Starting LLM extraction');

            const completion = await this.client.chat.completions.create({
                model,
                temperature,
                max_tokens: maxTokens,
                messages: [
                    {
                        role: 'system',
                        content: `You are a precise document data extraction assistant. Extract structured data according to the provided schema. For each field, provide:
1. The extracted value
2. A confidence score (0.0 to 1.0)
3. Evidence snippet from the document (exact text and location)

Return JSON only. No additional commentary.`,
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                response_format: { type: 'json_object' },
            });

            const responseText = completion.choices[0]?.message?.content || '{}';
            const parsed = JSON.parse(responseText);

            // Extract data, confidence, and evidence from structured response
            const data: Record<string, any> = {};
            const confidence: Record<string, number> = {};
            const evidence: Record<string, any[]> = {};

            // Assume the LLM returns { fields: [ { name, value, confidence, evidence } ] }
            if (parsed.fields && Array.isArray(parsed.fields)) {
                for (const field of parsed.fields) {
                    data[field.name] = field.value;
                    confidence[field.name] = field.confidence || 0.5;
                    evidence[field.name] = field.evidence ? [field.evidence] : [];
                }
            }

            const usage = {
                inputTokens: completion.usage?.prompt_tokens || 0,
                outputTokens: completion.usage?.completion_tokens || 0,
                totalTokens: completion.usage?.total_tokens || 0,
            };

            const cost = calculateCost({
                model,
                inputTokens: usage.inputTokens,
                outputTokens: usage.outputTokens,
            });

            logger.info({ usage, cost }, 'LLM extraction completed');

            return {
                data,
                confidence,
                evidence,
                usage,
                cost,
            };
        } catch (error: any) {
            logger.error({ error: error.message }, 'LLM extraction failed');
            throw new Error(`OpenAI extraction failed: ${error.message}`);
        }
    }

    estimateCost(params: CostParams): number {
        return calculateCost({
            model: params.model,
            inputTokens: params.inputTokens,
            outputTokens: params.estimatedOutputTokens,
        });
    }
}
