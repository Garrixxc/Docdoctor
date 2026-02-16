// Settings type definitions for DocDoctor

// ============ Simple Settings ============

export interface SimpleSettings {
    /** 0-100: lower = cheaper/faster, higher = more accurate/expensive */
    costVsAccuracy: number;
    /** true = prioritize speed (by_pages), false = prioritize thoroughness (headings) */
    speedVsThoroughness: boolean;
}

// ============ Advanced Settings ============

export type ChunkingMethod = 'by_pages' | 'fixed_tokens' | 'headings';

export interface AdvancedSettings {
    // Chunking
    chunkingMethod: ChunkingMethod;
    chunkSize: number;
    overlap: number;
    // Model
    provider: string;
    model: string;
    temperature: number;
    // Confidence thresholds
    autoAcceptThreshold: number; // fields >= this are auto-approved
    needsReviewThreshold: number; // fields < this get NEEDS_REVIEW
    // Cost guardrail
    maxCostPerRun: number | null; // null = no limit
}

// ============ Workspace Settings ============

export type WorkspaceKeyMode = 'platform' | 'byo';

export interface WorkspaceSettings {
    provider: string;
    keyMode: WorkspaceKeyMode;
    // Note: encrypted key stored in workspace.settings.encryptedApiKey
    // Never returned to client
    encryptedApiKey?: string;
}

// ============ Project API Key Settings ============

export type ProjectKeyMode = 'inherit_workspace' | 'byo_project_key';

// ============ Template Config ============

export interface DetectionKeyword {
    text: string;
    weight: 'high' | 'medium' | 'low';
}

export interface TemplateFieldConfig {
    name: string;
    type: 'string' | 'number' | 'date' | 'boolean' | 'array';
    description: string;
    required: boolean;
    arrayItemSchema?: TemplateFieldConfig[];
}

export interface TemplateValidatorConfig {
    field: string;
    rule: string;
    params?: Record<string, any>;
    message: string;
}

export interface TemplateConfigJson {
    fields: TemplateFieldConfig[];
    validators: TemplateValidatorConfig[];
    extractionPrompt: string;
    detectionKeywords: DetectionKeyword[];
    description: string;
    icon: string; // lucide icon name
    exampleUseCase: string;
}

// ============ Default Values ============

export const DEFAULT_ADVANCED_SETTINGS: AdvancedSettings = {
    chunkingMethod: 'by_pages',
    chunkSize: 4000,
    overlap: 200,
    provider: 'openai',
    model: 'gpt-4o-mini',
    temperature: 0.1,
    autoAcceptThreshold: 0.95,
    needsReviewThreshold: 0.7,
    maxCostPerRun: null,
};

export const DEFAULT_SIMPLE_SETTINGS: SimpleSettings = {
    costVsAccuracy: 50,
    speedVsThoroughness: true,
};

export const AVAILABLE_MODELS = [
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Fastest, Cheapest)', tier: 'economy' },
    { value: 'gpt-4o', label: 'GPT-4o (Balanced)', tier: 'standard' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo (Most Accurate)', tier: 'premium' },
];

export const AVAILABLE_CHUNKING_METHODS = [
    { value: 'by_pages', label: 'By Pages', description: 'Split by PDF page boundaries' },
    { value: 'fixed_tokens', label: 'Fixed Tokens', description: 'Split by token count' },
    { value: 'headings', label: 'By Headings', description: 'Split by document headings' },
];
