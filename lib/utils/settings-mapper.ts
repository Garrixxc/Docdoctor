// Maps Simple mode settings to Advanced settings

import {
    SimpleSettings,
    AdvancedSettings,
    DEFAULT_ADVANCED_SETTINGS,
} from '@/types/settings-types';

/**
 * Map simple settings (cost_vs_accuracy, speed_vs_thoroughness)
 * into fully resolved advanced settings.
 */
export function mapSimpleToAdvanced(simple: SimpleSettings): AdvancedSettings {
    const { costVsAccuracy, speedVsThoroughness } = simple;

    // Model selection based on cost vs accuracy
    let model: string;
    let temperature: number;
    if (costVsAccuracy <= 30) {
        model = 'gpt-4o-mini';
        temperature = 0.1;
    } else if (costVsAccuracy <= 70) {
        model = 'gpt-4o';
        temperature = 0.1;
    } else {
        model = 'gpt-4-turbo';
        temperature = 0.05;
    }

    // Chunking method based on speed vs thoroughness
    const chunkingMethod = speedVsThoroughness ? 'by_pages' : 'headings';

    // Chunk sizes — speed mode uses larger chunks
    const chunkSize = speedVsThoroughness ? 6000 : 3000;
    const overlap = speedVsThoroughness ? 100 : 300;

    // Confidence thresholds — more accuracy = stricter
    const autoAcceptThreshold = costVsAccuracy > 50 ? 0.92 : 0.95;
    const needsReviewThreshold = costVsAccuracy > 50 ? 0.65 : 0.7;

    // Cost limit — economy mode gets tighter limit
    const maxCostPerRun = costVsAccuracy <= 30 ? 5.0 : costVsAccuracy <= 70 ? 15.0 : null;

    return {
        chunkingMethod,
        chunkSize,
        overlap,
        provider: 'openai',
        model,
        temperature,
        autoAcceptThreshold,
        needsReviewThreshold,
        maxCostPerRun,
    };
}

/**
 * Merge partial advanced settings with defaults,
 * ensuring all fields are populated.
 */
export function resolveAdvancedSettings(
    partial?: Partial<AdvancedSettings>
): AdvancedSettings {
    return {
        ...DEFAULT_ADVANCED_SETTINGS,
        ...partial,
    };
}
